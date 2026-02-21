const express = require("express");
const router = express.Router();

const Submission = require("../models/submission");
const { userAuth } = require("../middleware/adminAuth");

// GET /users/activity?days=365
// Returns per-day submission counts for the authenticated user.
router.get("/activity", userAuth, async (req, res) => {
  try {
    const daysRaw = Number(req.query.days);
    const days = Number.isFinite(daysRaw)
      ? Math.min(Math.max(daysRaw, 1), 365)
      : 365;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const activity = await Submission.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      days,
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
