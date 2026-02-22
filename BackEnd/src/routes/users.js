const express = require("express");
const router = express.Router();

const Submission = require("../models/submission");
const Problem = require("../models/problem");
const User = require("../models/user");
const { userAuth } = require("../middleware/adminAuth");

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

function formatYmdInTimeZone(date, timeZone) {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toYmd(date) {
  return formatYmdInTimeZone(date, APP_TIMEZONE);
}

function computeStreaksFromYmdDays(daysAsc) {
  // daysAsc is an array of YYYY-MM-DD sorted ascending.
  let best = 0;
  let currentRun = 0;

  for (let i = 0; i < daysAsc.length; i++) {
    if (i === 0) {
      currentRun = 1;
      best = 1;
      continue;
    }

    const prev = new Date(daysAsc[i - 1] + "T00:00:00Z");
    const cur = new Date(daysAsc[i] + "T00:00:00Z");
    const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) currentRun += 1;
    else currentRun = 1;
    if (currentRun > best) best = currentRun;
  }

  const today = toYmd(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toYmd(yesterdayDate);
  const daySet = new Set(daysAsc);

  let current = 0;
  // LeetCode-style: streak counts up to today if there is activity today,
  // otherwise can extend from yesterday.
  let cursor = daySet.has(today)
    ? new Date(today + "T00:00:00Z")
    : daySet.has(yesterday)
      ? new Date(yesterday + "T00:00:00Z")
      : null;
  while (cursor) {
    const key = toYmd(cursor);
    if (!daySet.has(key)) break;
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}

// GET /users/activity?days=365
// Returns per-day submission counts for the authenticated user.
router.get("/activity", userAuth, async (req, res) => {
  try {
    const metric = String(req.query.metric || "submissions").toLowerCase();
    const daysRaw = Number(req.query.days);
    const days = Number.isFinite(daysRaw)
      ? Math.min(Math.max(daysRaw, 1), 365)
      : 365;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const baseMatch = {
      userId: req.user._id,
      createdAt: { $gte: startDate },
    };

    const activity =
      metric === "solved"
        ? await Submission.aggregate([
            {
              $match: {
                ...baseMatch,
                verdict: "Accepted",
              },
            },
            {
              $group: {
                _id: {
                  day: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$createdAt",
                      timezone: APP_TIMEZONE,
                    },
                  },
                  problemId: "$problemId",
                },
              },
            },
            { $group: { _id: "$_id.day", count: { $sum: 1 } } },
            { $project: { _id: 0, date: "$_id", count: 1 } },
            { $sort: { date: 1 } },
          ])
        : await Submission.aggregate([
            { $match: baseMatch },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: APP_TIMEZONE,
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, date: "$_id", count: 1 } },
            { $sort: { date: 1 } },
          ]);

    res.json({
      success: true,
      days,
      metric: metric === "solved" ? "solved" : "submissions",
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /users/:id/activity?days=365
// Returns per-day submission counts for the specified user.
router.get("/:id/activity", userAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("_id");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const metric = String(req.query.metric || "submissions").toLowerCase();

    const all = String(req.query.all || "").toLowerCase();
    const allEnabled = all === "1" || all === "true" || all === "yes";

    const daysRaw = Number(req.query.days);
    const daysCap = 3650;
    const days = Number.isFinite(daysRaw)
      ? Math.min(Math.max(daysRaw, 1), daysCap)
      : 365;

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let startDate;
    if (allEnabled) {
      const first = await Submission.findOne({ userId: user._id })
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean();
      if (first?.createdAt) {
        startDate = new Date(first.createdAt);
        startDate.setHours(0, 0, 0, 0);

        const capStart = new Date();
        capStart.setHours(0, 0, 0, 0);
        capStart.setDate(capStart.getDate() - (daysCap - 1));
        if (startDate < capStart) startDate = capStart;
      } else {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      }
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - (days - 1));
    }

    const baseMatch = {
      userId: user._id,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    const activity =
      metric === "solved"
        ? await Submission.aggregate([
            {
              $match: {
                ...baseMatch,
                verdict: "Accepted",
              },
            },
            {
              $group: {
                _id: {
                  day: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$createdAt",
                      timezone: APP_TIMEZONE,
                    },
                  },
                  problemId: "$problemId",
                },
              },
            },
            { $group: { _id: "$_id.day", count: { $sum: 1 } } },
            { $project: { _id: 0, date: "$_id", count: 1 } },
            { $sort: { date: 1 } },
          ])
        : await Submission.aggregate([
            { $match: baseMatch },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: APP_TIMEZONE,
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, date: "$_id", count: 1 } },
            { $sort: { date: 1 } },
          ]);

    res.json({
      success: true,
      timezone: APP_TIMEZONE,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      days: Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1),
      metric: metric === "solved" ? "solved" : "submissions",
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching user activity (by id):", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /users/:id/solved-problems?limit=50
// Returns unique accepted problems (title + difficulty) for the specified user.
router.get("/:id/solved-problems", userAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("_id");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 200)
      : 50;

    const solved = await Submission.aggregate([
      { $match: { userId: user._id, verdict: "Accepted" } },
      {
        $group: {
          _id: "$problemId",
          lastAcceptedAt: { $max: "$createdAt" },
        },
      },
      { $sort: { lastAcceptedAt: -1 } },
      {
        $lookup: {
          from: Problem.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: "$problem" },
      {
        $project: {
          _id: 0,
          problemId: "$_id",
          title: "$problem.title",
          difficulty: "$problem.difficulty",
          lastAcceptedAt: 1,
        },
      },
      { $limit: limit },
    ]);

    res.json({ success: true, data: solved });
  } catch (error) {
    console.error("Error fetching solved problems:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /users/:id/stats
// Returns public profile + solve stats for the specified user.
router.get("/:id/stats", userAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("firstName lastName photoUrl");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const [problemTotal, problemEasy, problemMedium, problemHard] = await Promise.all([
      Problem.countDocuments({}),
      Problem.countDocuments({ difficulty: "Easy" }),
      Problem.countDocuments({ difficulty: "Medium" }),
      Problem.countDocuments({ difficulty: "Hard" }),
    ]);

    const [totalSubmissions, acceptedSubmissions] = await Promise.all([
      Submission.countDocuments({ userId: user._id }),
      Submission.countDocuments({ userId: user._id, verdict: "Accepted" }),
    ]);

    const acceptanceRate = totalSubmissions
      ? Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10
      : 0;

    const solvedByDifficulty = await Submission.aggregate([
      { $match: { userId: user._id, verdict: "Accepted" } },
      { $group: { _id: "$problemId" } },
      {
        $lookup: {
          from: Problem.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: "$problem" },
      { $group: { _id: "$problem.difficulty", count: { $sum: 1 } } },
    ]);

    const solved = { easy: 0, medium: 0, hard: 0 };
    for (const row of solvedByDifficulty) {
      if (row._id === "Easy") solved.easy = row.count;
      else if (row._id === "Medium") solved.medium = row.count;
      else if (row._id === "Hard") solved.hard = row.count;
    }
    const totalSolved = solved.easy + solved.medium + solved.hard;

    const attemptingAgg = await Submission.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$problemId",
          hasAccepted: {
            $max: {
              $cond: [{ $eq: ["$verdict", "Accepted"] }, 1, 0],
            },
          },
        },
      },
      { $match: { hasAccepted: 0 } },
      { $count: "count" },
    ]);
    const attempting = attemptingAgg?.[0]?.count || 0;

    const languages = await Submission.aggregate([
      { $match: { userId: user._id, verdict: "Accepted" } },
      { $group: { _id: { problemId: "$problemId", languageId: "$languageId" } } },
      { $group: { _id: "$_id.languageId", problemsSolved: { $sum: 1 } } },
      { $sort: { problemsSolved: -1, _id: 1 } },
    ]);

    const skills = await Submission.aggregate([
      { $match: { userId: user._id, verdict: "Accepted" } },
      { $group: { _id: "$problemId" } },
      {
        $lookup: {
          from: Problem.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: "$problem" },
      { $unwind: { path: "$problem.tags", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$problem.tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 40 },
    ]);

    const acceptedDays = await Submission.aggregate([
      { $match: { userId: user._id, verdict: "Accepted" } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: APP_TIMEZONE,
            },
          },
        },
      },
      { $project: { _id: 0, day: "$_id" } },
      { $sort: { day: 1 } },
    ]);
    const dayList = acceptedDays.map((d) => d.day);
    const streak = computeStreaksFromYmdDays(dayList);

    res.json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
      },
      stats: {
        problemTotals: {
          total: problemTotal,
          easy: problemEasy,
          medium: problemMedium,
          hard: problemHard,
        },
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        solved: {
          total: totalSolved,
          easy: solved.easy,
          medium: solved.medium,
          hard: solved.hard,
        },
        attempting,
        languages,
        skills,
        streak,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
