const express = require("express");
const router = express.Router();
const Problem = require("../models/problem");
const axios = require("axios");
const { userAuth } = require("../middleware/adminAuth");

// Protected RUN route
router.post("/run", userAuth, async (req, res) => {
    try {
        const { problemId, sourceCode, languageId } = req.body;

        if (!problemId || !sourceCode || !languageId) {
            return res.status(400).json({ message: "Missing fields" });
        }

        // Logged-in user
        const user = req.user;

        // Fetch problem
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        const sampleTestcases = problem.sampleTestcases;
        let results = [];

        for (let testcase of sampleTestcases) {
            // const judgeResponse = await axios.post(
            //     "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true",
            //     {
            //         source_code: sourceCode,
            //         language_id: languageId,
            //         stdin: testcase.input,
            //     },
            //     {
            //         headers: {
            //             "Content-Type": "application/json",
            //         },
            //     }
            // );
            const judgeResponse = await axios.post(
                "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true", // 👈 Removed trailing spaces
                {
                    source_code: sourceCode,
                    language_id: languageId,
                    stdin: testcase.input,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        // Add X-RapidAPI-Key if using RapidAPI version
                        // "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
                    },
                }
            );
            if (judgeResponse.data.status?.id !== 3) { // 3 = Accepted
                // Handle compilation/runtime errors
                results.push({
                    input: testcase.input,
                    expectedOutput: testcase.output,
                    actualOutput: judgeResponse.data.stderr || judgeResponse.data.stdout?.trim() || "",
                    status: judgeResponse.data.status?.description || "Unknown Error",
                    time: judgeResponse.data.time,
                    memory: judgeResponse.data.memory,
                });
            } else {
                results.push({
                    input: testcase.input,
                    expectedOutput: testcase.output,
                    actualOutput: judgeResponse.data.stdout?.trim(),
                    status: "Accepted",
                    time: judgeResponse.data.time,
                    memory: judgeResponse.data.memory,
                });
            }
        }

        console.log("Results being sent:", results);

        res.json({
            message: "Run completed",
            userId: user._id,
            results,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Run failed" });
    }
});

module.exports = router;