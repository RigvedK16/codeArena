// routes/problems.js
const express = require("express");
const router = express.Router();
const Problem = require("../models/problem");
const { userAuth } = require("../middleware/adminAuth");

// GET all problems (public - for practice mode)
router.get("/", async (req, res) => {
    try {
        const { difficulty, tag, search } = req.query;

        let filter = {};

        if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
            filter.difficulty = difficulty;
        }

        if (tag) {
            filter.tags = { $in: [new RegExp(tag, "i")] };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } }
            ];
        }

        const problems = await Problem.find(filter)
            .select("title difficulty tags acceptanceRate solvedCount")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: problems.length,
            data: problems
        });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET single problem by ID (protected - for solving)
router.get("/:id", async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }

        // Send problem data WITHOUT hidden testcases
        const { hiddenTestcases, ...problemData } = problem.toObject();

        res.json({
            success: true,
            data: problemData
        });
    } catch (error) {
        console.error("Error fetching problem:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;