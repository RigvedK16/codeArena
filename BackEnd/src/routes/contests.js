const express = require("express");
const router = express.Router();

const { userAuth, optionalUserAuth } = require("../middleware/adminAuth");
const contestController = require("../controllers/contestController");

// Public
router.get("/", optionalUserAuth, contestController.listContests);
router.get("/global-leaderboard", contestController.getGlobalContestLeaderboard);
router.get("/:id", optionalUserAuth, contestController.getContestById);
router.get("/:id/leaderboard", contestController.getContestLeaderboard);

// Protected
router.post("/:id/register", userAuth, contestController.registerForContest);
router.post("/:id/start-problem", userAuth, contestController.startContestProblem);
router.post("/:id/violation", userAuth, contestController.logContestViolation);
router.post("/:id/submit", userAuth, contestController.submitContestCode);

module.exports = router;
