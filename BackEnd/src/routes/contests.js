const express = require("express");
const router = express.Router();

const { userAuth } = require("../middleware/adminAuth");
const contestController = require("../controllers/contestController");

// Public
router.get("/", contestController.listContests);
router.get("/:id", contestController.getContestById);
router.get("/:id/leaderboard", contestController.getContestLeaderboard);

// Protected
router.post("/:id/submit", userAuth, contestController.submitContestCode);

module.exports = router;
