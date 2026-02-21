// const express = require("express");
// const router = express.Router();
// const Problem = require("../models/problem");
// const axios = require("axios");
// const { userAuth } = require("../middleware/adminAuth");

// // Protected RUN route
// router.post("/run", userAuth, async (req, res) => {
//     try {
//         const { problemId, sourceCode, languageId } = req.body;

//         if (!problemId || !sourceCode || !languageId) {
//             return res.status(400).json({ message: "Missing fields" });
//         }

//         // Logged-in user
//         const user = req.user;

//         // Fetch problem
//         const problem = await Problem.findById(problemId);
//         if (!problem) {
//             return res.status(404).json({ message: "Problem not found" });
//         }

//         const sampleTestcases = problem.sampleTestcases;
//         let results = [];

//         for (let testcase of sampleTestcases) {
//             // const judgeResponse = await axios.post(
//             //     "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true",
//             //     {
//             //         source_code: sourceCode,
//             //         language_id: languageId,
//             //         stdin: testcase.input,
//             //     },
//             //     {
//             //         headers: {
//             //             "Content-Type": "application/json",
//             //         },
//             //     }
//             // );
//             const judgeResponse = await axios.post(
//                 "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true", // 👈 Removed trailing spaces
//                 {
//                     source_code: sourceCode,
//                     language_id: languageId,
//                     stdin: testcase.input,
//                 },
//                 {
//                     headers: {
//                         "Content-Type": "application/json",
//                         // Add X-RapidAPI-Key if using RapidAPI version
//                         // "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
//                     },
//                 }
//             );
//             if (judgeResponse.data.status?.id !== 3) { // 3 = Accepted
//                 // Handle compilation/runtime errors
//                 results.push({
//                     input: testcase.input,
//                     expectedOutput: testcase.output,
//                     actualOutput: judgeResponse.data.stderr || judgeResponse.data.stdout?.trim() || "",
//                     status: judgeResponse.data.status?.description || "Unknown Error",
//                     time: judgeResponse.data.time,
//                     memory: judgeResponse.data.memory,
//                 });
//             } else {
//                 results.push({
//                     input: testcase.input,
//                     expectedOutput: testcase.output,
//                     actualOutput: judgeResponse.data.stdout?.trim(),
//                     status: "Accepted",
//                     time: judgeResponse.data.time,
//                     memory: judgeResponse.data.memory,
//                 });
//             }
//         }

//         console.log("Results being sent:", results);

//         res.json({
//             message: "Run completed",
//             userId: user._id,
//             results,
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Run failed" });
//     }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Problem = require("../models/problem");
const axios = require("axios");
const { userAuth } = require("../middleware/adminAuth");

// ---------- INPUT PARSER ----------
function parseInputString(inputStr) {
  if (!inputStr || typeof inputStr !== "string") return {};

  let obj = {};
  // Split on commas that are followed by a word and equals sign (handles arrays with commas)
  let pairs = inputStr.trim().split(/,(?=\s*\w+\s*=)/);

  for (let pair of pairs) {
    let eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;

    let key = pair.substring(0, eqIndex).trim();
    let value = pair.substring(eqIndex + 1).trim();

    try {
      // Try to parse as JSON (handles arrays, numbers, booleans, strings)
      obj[key] = JSON.parse(value);
    } catch {
      // Fallback: keep as string
      obj[key] = value;
    }
  }
  return obj;
}

// ---------- JAVASCRIPT WRAPPER ----------
function buildJSWrapper(sourceCode, inputObj) {
  let vars = "";
  for (let key in inputObj) {
    vars += `const ${key} = ${JSON.stringify(inputObj[key])};\n`;
  }

  return `
${sourceCode}

// Auto-generated input injection
${vars}
const result = solve(${Object.keys(inputObj).join(", ")});
// Output as JSON for consistent comparison
console.log(JSON.stringify(result));
`;
}

// ---------- C++ WRAPPER (Fixed - no if constexpr) ----------
function buildCPPWrapper(sourceCode, inputObj) {
  let includes = "#include <bits/stdc++.h>\nusing namespace std;\n\n";
  let vars = "";
  let args = [];

  for (let key in inputObj) {
    args.push(key);
    if (Array.isArray(inputObj[key])) {
      // Handle array input
      let arr = inputObj[key]
        .map((v) => (typeof v === "string" ? `"${v}"` : v))
        .join(",");
      vars += `vector<int> ${key} = {${arr}};\n`;
    } else if (typeof inputObj[key] === "string") {
      vars += `string ${key} = "${inputObj[key]}";\n`;
    } else {
      vars += `int ${key} = ${inputObj[key]};\n`;
    }
  }

  return `${includes}${sourceCode}

int main() {
${vars}
    auto result = solve(${args.join(", ")});
    
    // Output handling for different return types
    if constexpr (std::is_same_v<decltype(result), vector<int>>) {
        cout << "[";
        for(size_t i = 0; i < result.size(); i++) {
            cout << result[i];
            if(i < result.size() - 1) cout << ",";
        }
        cout << "]";
    } else {
        cout << result;
    }
    return 0;
}
`;
}

// ---------- PYTHON WRAPPER ----------
function buildPythonWrapper(sourceCode, inputObj) {
  let vars = "";
  let args = [];

  for (let key in inputObj) {
    args.push(key);
    // Python syntax for arrays/lists
    if (Array.isArray(inputObj[key])) {
      vars += `${key} = ${JSON.stringify(inputObj[key])}\n`;
    } else {
      vars += `${key} = ${JSON.stringify(inputObj[key])}\n`;
    }
  }

  return `
${sourceCode}

# Auto-generated input injection
${vars}
result = solve(${args.join(", ")})
# Output as JSON for consistent comparison
import json
print(json.dumps(result))
`;
}

// ---------- JAVA WRAPPER ----------
function buildJavaWrapper(sourceCode, inputObj) {
  let imports = "import java.util.*;\n\n";
  let vars = "";
  let args = [];
  let argTypes = [];

  for (let key in inputObj) {
    args.push(key);
    if (Array.isArray(inputObj[key])) {
      // Java array initialization
      let arr = inputObj[key].join(",");
      vars += `int[] ${key} = {${arr}};\n`;
      argTypes.push("int[]");
    } else if (typeof inputObj[key] === "string") {
      vars += `String ${key} = "${inputObj[key]}";\n`;
      argTypes.push("String");
    } else {
      vars += `int ${key} = ${inputObj[key]};\n`;
      argTypes.push("int");
    }
  }

  return `${imports}public class Main {
${sourceCode}

    public static void main(String[] args) {
${vars}
        Object result = solve(${args.join(", ")});
        // Output handling
        if (result instanceof int[]) {
            int[] arr = (int[]) result;
            System.out.print("[");
            for(int i = 0; i < arr.length; i++) {
                System.out.print(arr[i]);
                if(i < arr.length - 1) System.out.print(",");
            }
            System.out.print("]");
        } else {
            System.out.print(result);
        }
    }
}
`;
}

// ---------- C WRAPPER ----------
function buildCWrapper(sourceCode, inputObj) {
  let includes = "#include <stdio.h>\n#include <stdlib.h>\n\n";
  let vars = "";
  let args = [];

  for (let key in inputObj) {
    args.push(key);
    if (Array.isArray(inputObj[key])) {
      // C array with size
      let arr = inputObj[key].join(",");
      vars += `int ${key}[] = {${arr}};\n`;
      vars += `int ${key}_size = ${inputObj[key].length};\n`;
    } else {
      vars += `int ${key} = ${inputObj[key]};\n`;
    }
  }

  return `${includes}${sourceCode}

int main() {
${vars}
    int result = solve(${args
      .map((k) => (Array.isArray(inputObj[k]) ? `${k}, ${k}_size` : k))
      .join(", ")});
    printf("%d", result);
    return 0;
}
`;
}

// ---------- OUTPUT NORMALIZER ----------
function normalizeOutput(output) {
  if (!output && output !== 0) return "";

  // Convert to string and trim whitespace
  let str = output.toString().trim();

  // Remove trailing newlines/carriage returns
  str = str.replace(/[\r\n]+$/, "");

  try {
    // Try to parse as JSON and re-stringify for consistent format
    let parsed = JSON.parse(str);
    return JSON.stringify(parsed);
  } catch (e) {
    // If not valid JSON, return the trimmed string wrapped in quotes for comparison
    return JSON.stringify(str);
  }
}

// ---------- RUN ROUTE ----------
router.post("/run", userAuth, async (req, res) => {
  try {
    const { problemId, sourceCode, languageId } = req.body;

    if (!problemId || !sourceCode || !languageId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = req.user;
    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const sampleTestcases = problem.sampleTestcases;
    if (!sampleTestcases || sampleTestcases.length === 0) {
      return res.status(400).json({ message: "No test cases configured" });
    }

    let results = [];

    for (let testcase of sampleTestcases) {
      // Parse input string into object
      let inputObj = parseInputString(testcase.input);
      let finalCode = sourceCode;

      // Apply language-specific wrapper
      switch (languageId) {
        case 63: // JavaScript (Node.js)
          finalCode = buildJSWrapper(sourceCode, inputObj);
          break;
        case 52: // C++ (GCC)
          finalCode = buildCPPWrapper(sourceCode, inputObj);
          break;
        case 71: // Python (3.8.1)
          finalCode = buildPythonWrapper(sourceCode, inputObj);
          break;
        case 62: // Java (OpenJDK)
          finalCode = buildJavaWrapper(sourceCode, inputObj);
          break;
        case 48: // C (GCC)
          finalCode = buildCWrapper(sourceCode, inputObj);
          break;
        default:
          // For unsupported languages, use raw code with stdin
          console.warn(
            `No wrapper for languageId: ${languageId}, using raw code`,
          );
      }

      // Call Judge0 API - ✅ Fixed: removed trailing spaces in URL
      const judgeResponse = await axios.post(
        "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true",
        {
          source_code: finalCode,
          language_id: languageId,
          stdin: "", // Input is injected via wrapper, not stdin
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000, // 15 second timeout per testcase
        },
      );

      const { status, stdout, stderr, time, memory } = judgeResponse.data;
      const statusId = status?.id;

      // Handle execution errors
      if (statusId !== 3) {
        // 3 = Accepted in Judge0
        results.push({
          input: testcase.input,
          expectedOutput: testcase.output,
          actualOutput: stderr || stdout?.trim() || "",
          status: status?.description || "Unknown Error",
          time: time || null,
          memory: memory || null,
        });
        continue;
      }

      // Normalize and compare outputs
      const normalizedExpected = normalizeOutput(testcase.output);
      const normalizedActual = normalizeOutput(stdout?.trim() || "");
      const isMatching = normalizedExpected === normalizedActual;

      results.push({
        input: testcase.input,
        expectedOutput: testcase.output,
        actualOutput: stdout?.trim() || "",
        status: isMatching ? "Accepted" : "Wrong Answer",
        time: time || null,
        memory: memory || null,
      });
    }

    res.json({
      message: "Run completed",
      userId: user._id,
      results,
    });
  } catch (error) {
    console.error("Run route error:", error);

    // Handle specific error types
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return res.status(504).json({ message: "Execution timed out" });
    }
    if (error.response?.status === 429) {
      return res
        .status(429)
        .json({ message: "Rate limit exceeded. Please wait." });
    }

    res.status(500).json({
      message: "Run failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
