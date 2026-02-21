const express = require("express");
const router = express.Router();
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const axios = require("axios");
const { userAuth } = require("../middleware/adminAuth");

router.post("/submit", userAuth, async (req, res) => {
    try {
        const { problemId, sourceCode, languageId } = req.body;
        const user = req.user;

        if (!problemId || !sourceCode || !languageId) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        const hiddenTestcases = problem.hiddenTestcases;

        let passed = 0;
        let total = hiddenTestcases.length;
        let finalVerdict = "Accepted";

        for (let testcase of hiddenTestcases) {

            const judgeResponse = await axios.post(
                "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true",
                {
                    source_code: sourceCode,
                    language_id: languageId,
                    stdin: testcase.input,
                },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            const statusId = judgeResponse.data.status?.id;
            const output = judgeResponse.data.stdout?.trim();

            if (statusId !== 3) {
                finalVerdict = judgeResponse.data.status.description;
                break;
            }

            if (output !== testcase.output.trim()) {
                finalVerdict = "Wrong Answer";
                break;
            }

            passed++;
        }

        if (passed !== total && finalVerdict === "Accepted") {
            finalVerdict = "Wrong Answer";
        }

        const submission = await Submission.create({
            userId: user._id,
            problemId,
            sourceCode,
            languageId,
            verdict: finalVerdict,
            passedTestcases: passed,
            totalTestcases: total,
        });

        res.json({
            verdict: finalVerdict,
            passedTestcases: passed,
            totalTestcases: total,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Submission failed" });
    }
});

module.exports = router;