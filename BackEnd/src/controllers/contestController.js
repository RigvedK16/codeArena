const axios = require("axios");
const mongoose = require("mongoose");
const Contest = require("../models/contest");
const ContestSubmission = require("../models/contestSubmission");
const Problem = require("../models/problem");

const JUDGE0_URL =
  "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true";

// Scoring / penalty config (minutes-based)
// Faster solutions earn more points.
const MAX_TIME_TAKEN_MINUTES = 60;
const SOLVE_WINDOW_MINUTES = 60;
const SOLVE_WINDOW_MS = SOLVE_WINDOW_MINUTES * 60 * 1000;
const SCORE_TIME_DECAY_PER_MIN = 1; // subtract 1 point per minute from base points
const SCORE_WRONG_ATTEMPT_PENALTY = 10; // subtract 10 points per wrong attempt
const PENALTY_WRONG_ATTEMPT_MINUTES = 5; // add 5 minutes per wrong attempt to penalty

const LANGUAGE_NAME_BY_ID = {
  52: "C++ (GCC)",
  48: "C (GCC)",
  63: "JavaScript (Node.js)",
  71: "Python (3.8.1)",
  62: "Java (OpenJDK 13)",
};

function getContestPhase(contest, nowMs) {
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  if (nowMs < start) return "Upcoming";
  if (nowMs > end) return "Past";
  return "Live";
}

function minutesFromStart(contest, nowMs) {
  const startMs = new Date(contest.startTime).getTime();
  return Math.floor((nowMs - startMs) / 60000);
}

function minutesSince(msStart, nowMs) {
  return Math.floor((nowMs - msStart) / 60000);
}

function clampTimeTakenMinutes(mins) {
  return Math.min(MAX_TIME_TAKEN_MINUTES, Math.max(0, Math.floor(mins)));
}

function clampMin0(n) {
  return Math.max(0, n);
}

function computeEarnedScore(pointValue, solvedAtDuration, wrongAttempts) {
  const duration = clampTimeTakenMinutes(solvedAtDuration);
  const timePenaltyPoints = Math.floor(duration * SCORE_TIME_DECAY_PER_MIN);
  const wrongPenaltyPoints = Math.floor(
    wrongAttempts * SCORE_WRONG_ATTEMPT_PENALTY,
  );
  return clampMin0(pointValue - timePenaltyPoints - wrongPenaltyPoints);
}

function computePenaltyMinutes(solvedAtDuration, wrongAttempts) {
  const duration = clampTimeTakenMinutes(solvedAtDuration);
  return Math.floor(duration + wrongAttempts * PENALTY_WRONG_ATTEMPT_MINUTES);
}

async function getParticipantSnapshot(contestId, userId) {
  const contestForUser = await Contest.findOne(
    { _id: contestId, "participants.userId": userId },
    { "participants.$": 1 },
  );
  return contestForUser?.participants?.[0] || null;
}

exports.createContest = async (req, res) => {
  try {
    const adminUserId = req.user?._id;
    if (!adminUserId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const title =
      typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";
    const startTimeRaw = req.body?.startTime;
    const endTimeRaw = req.body?.endTime;
    const problemsRaw = Array.isArray(req.body?.problems)
      ? req.body.problems
      : [];

    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    if (!startTimeRaw)
      return res
        .status(400)
        .json({ success: false, message: "startTime is required" });
    if (!endTimeRaw)
      return res
        .status(400)
        .json({ success: false, message: "endTime is required" });

    const startTime = new Date(startTimeRaw);
    const endTime = new Date(endTimeRaw);
    if (Number.isNaN(startTime.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "startTime is invalid" });
    }
    if (Number.isNaN(endTime.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "endTime is invalid" });
    }
    if (endTime.getTime() <= startTime.getTime()) {
      return res
        .status(400)
        .json({ success: false, message: "endTime must be after startTime" });
    }

    const problems = [];
    for (const p of problemsRaw) {
      const problemId = p?.problemId;
      const pointValue = Number(p?.pointValue);

      if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid problemId in problems" });
      }
      if (Number.isNaN(pointValue) || pointValue < 0) {
        return res.status(400).json({
          success: false,
          message: "pointValue must be a non-negative number",
        });
      }

      problems.push({ problemId, pointValue: Math.floor(pointValue) });
    }

    if (problems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least 1 problem is required" });
    }

    const uniqueIds = Array.from(
      new Set(problems.map((p) => String(p.problemId))),
    );
    const foundCount = await Problem.countDocuments({
      _id: { $in: uniqueIds },
    });
    if (foundCount !== uniqueIds.length) {
      return res
        .status(400)
        .json({ success: false, message: "One or more problems do not exist" });
    }

    const contest = await Contest.create({
      title,
      description,
      startTime,
      endTime,
      createdBy: adminUserId,
      problems,
      participants: [],
    });

    return res.status(201).json({ success: true, data: contest });
  } catch (err) {
    console.error("Error creating contest:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

async function judgeAgainstHiddenTests({ problem, sourceCode, languageId }) {
  const hiddenTestcases = problem.hiddenTestcases || [];

  if (hiddenTestcases.length === 0) {
    // If there are no hidden testcases configured, treat as WA (safe default)
    return { status: "WA" };
  }

  for (const testcase of hiddenTestcases) {
    const judgeResponse = await axios.post(
      JUDGE0_URL,
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const judgeStatusId = judgeResponse?.data?.status?.id;
    if (judgeStatusId !== 3) {
      // 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded
      if (judgeStatusId === 5) return { status: "TLE" };
      return { status: "WA" };
    }
  }

  return { status: "Accepted" };
}

async function ensureParticipantAndProblemStats(
  contestId,
  userId,
  problemObjectId,
) {
  // Create participant if missing
  await Contest.updateOne(
    { _id: contestId, "participants.userId": { $ne: userId } },
    {
      $push: {
        participants: {
          userId,
          totalScore: 0,
          totalPenaltyTime: 0,
          problemStats: [],
        },
      },
    },
  );

  // Create problemStats entry if missing for this participant
  await Contest.updateOne(
    {
      _id: contestId,
      participants: {
        $elemMatch: {
          userId,
          problemStats: {
            $not: { $elemMatch: { problemId: problemObjectId } },
          },
        },
      },
    },
    {
      $push: {
        "participants.$.problemStats": {
          problemId: problemObjectId,
          status: "unsolved",
          startedAt: null,
          solvedAtDuration: null,
          wrongAttempts: 0,
        },
      },
    },
  );
}

async function ensureProblemStatsForExistingParticipant(
  contestId,
  userId,
  problemObjectId,
) {
  await Contest.updateOne(
    {
      _id: contestId,
      participants: {
        $elemMatch: {
          userId,
          problemStats: {
            $not: { $elemMatch: { problemId: problemObjectId } },
          },
        },
      },
    },
    {
      $push: {
        "participants.$.problemStats": {
          problemId: problemObjectId,
          status: "unsolved",
          startedAt: null,
          solvedAtDuration: null,
          wrongAttempts: 0,
        },
      },
    },
  );
}

exports.listContests = async (req, res) => {
  try {
    const currentUserId = req.user?._id;
    const currentUserIdStr = currentUserId ? String(currentUserId) : null;
    const contests = await Contest.find({})
      .select(
        "title description startTime endTime createdBy problems participants",
      )
      .sort({ startTime: -1 })
      .populate("createdBy", "firstName lastName emailId");

    res.json({
      success: true,
      data: contests.map((c) => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        startTime: c.startTime,
        endTime: c.endTime,
        createdBy: c.createdBy,
        problemsCount: c.problems?.length || 0,
        participantsCount: c.participants?.length || 0,
        isRegistered: currentUserIdStr
          ? (c.participants || []).some((p) => {
              const participantUserId = p?.userId?._id || p?.userId;
              return participantUserId
                ? String(participantUserId) === currentUserIdStr
                : false;
            })
          : false,
      })),
    });
  } catch (err) {
    console.error("Error listing contests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.registerForContest = async (req, res) => {
  try {
    const userId = req.user?._id;
    const contestId = req.params.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const contest = await Contest.findById(contestId).select(
      "startTime endTime problems participants title",
    );
    if (!contest) {
      return res
        .status(404)
        .json({ success: false, message: "Contest not found" });
    }

    const nowMs = Date.now();
    const endMs = new Date(contest.endTime).getTime();
    if (nowMs > endMs) {
      return res
        .status(400)
        .json({ success: false, message: "Contest has ended" });
    }

    const alreadyRegistered = (contest.participants || []).some(
      (p) => String(p.userId) === String(userId),
    );
    if (alreadyRegistered) {
      return res.json({ success: true, message: "Already registered" });
    }

    const problemStats = (contest.problems || []).map((p) => ({
      problemId: p.problemId,
      status: "unsolved",
      startedAt: null,
      solvedAtDuration: null,
      wrongAttempts: 0,
    }));

    const updateResult = await Contest.updateOne(
      { _id: contestId, "participants.userId": { $ne: userId } },
      {
        $push: {
          participants: {
            userId,
            totalScore: 0,
            totalPenaltyTime: 0,
            problemStats,
          },
        },
      },
    );

    return res.json({
      success: true,
      message: updateResult.modifiedCount ? "Registered" : "Already registered",
    });
  } catch (err) {
    console.error("Error registering for contest:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.startContestProblem = async (req, res) => {
  try {
    const userId = req.user?._id;
    const contestId = req.params.id;
    const { problemId } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!problemId)
      return res
        .status(400)
        .json({ success: false, message: "Missing problemId" });

    const contest = await Contest.findById(contestId).select(
      "startTime endTime problems participants",
    );
    if (!contest)
      return res
        .status(404)
        .json({ success: false, message: "Contest not found" });

    const nowMs = Date.now();
    const startMs = new Date(contest.startTime).getTime();
    const endMs = new Date(contest.endTime).getTime();
    if (nowMs < startMs || nowMs > endMs) {
      return res.status(400).json({
        success: false,
        message: "Contest is not live",
        phase: getContestPhase(contest, nowMs),
      });
    }

    const isRegistered = (contest.participants || []).some((p) => {
      const participantUserId = p?.userId?._id || p?.userId;
      return participantUserId
        ? String(participantUserId) === String(userId)
        : false;
    });
    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: "You are not registered for this contest",
      });
    }

    const contestProblem = (contest.problems || []).find(
      (p) => String(p.problemId) === String(problemId),
    );
    if (!contestProblem) {
      return res
        .status(400)
        .json({ success: false, message: "Problem not part of contest" });
    }

    const problemObjectId = new mongoose.Types.ObjectId(problemId);
    await ensureProblemStatsForExistingParticipant(
      contestId,
      userId,
      problemObjectId,
    );

    // Set startedAt only if it's not set yet (or missing)
    const nowDate = new Date(nowMs);
    await Contest.updateOne(
      {
        _id: contestId,
        participants: {
          $elemMatch: {
            userId,
            problemStats: {
              $elemMatch: {
                problemId: problemObjectId,
                $or: [{ startedAt: null }, { startedAt: { $exists: false } }],
              },
            },
          },
        },
      },
      {
        $set: {
          "participants.$[p].problemStats.$[ps].startedAt": nowDate,
        },
      },
      {
        arrayFilters: [
          { "p.userId": userId },
          { "ps.problemId": problemObjectId },
        ],
      },
    );

    const contestForUser = await Contest.findOne(
      { _id: contestId, "participants.userId": userId },
      { "participants.$": 1 },
    );
    const participant = contestForUser?.participants?.[0];
    const existingStat = participant?.problemStats?.find(
      (ps) => String(ps.problemId) === String(problemId),
    );

    const startedAt = existingStat?.startedAt
      ? new Date(existingStat.startedAt)
      : nowDate;
    const expiresAt = new Date(startedAt.getTime() + SOLVE_WINDOW_MS);

    return res.json({
      success: true,
      data: {
        startedAt,
        expiresAt,
      },
    });
  } catch (err) {
    console.error("Error in startContestProblem:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.logContestViolation = async (req, res) => {
  try {
    const userId = req.user?._id;
    const contestId = req.params.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const contest = await Contest.findById(contestId).select(
      "startTime endTime participants",
    );
    if (!contest)
      return res
        .status(404)
        .json({ success: false, message: "Contest not found" });

    const nowMs = Date.now();
    const startMs = new Date(contest.startTime).getTime();
    const endMs = new Date(contest.endTime).getTime();
    if (nowMs < startMs || nowMs > endMs) {
      return res
        .status(400)
        .json({ success: false, message: "Contest is not live" });
    }

    const updateResult = await Contest.updateOne(
      { _id: contestId, "participants.userId": userId },
      {
        $inc: { "participants.$[p].fullscreenViolations": 1 },
        $set: {
          "participants.$[p].lastFullscreenViolationAt": new Date(nowMs),
        },
      },
      { arrayFilters: [{ "p.userId": userId }] },
    );

    if (!updateResult.modifiedCount) {
      return res.status(403).json({
        success: false,
        message: "You are not registered for this contest",
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error in logContestViolation:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("problems.problemId", "title difficulty tags timeLimit");

    if (!contest) {
      return res
        .status(404)
        .json({ success: false, message: "Contest not found" });
    }

    const currentUserId = req.user?._id;
    const currentUserIdStr = currentUserId ? String(currentUserId) : null;
    const isRegistered = currentUserIdStr
      ? (contest.participants || []).some((p) => {
          const participantUserId = p?.userId?._id || p?.userId;
          return participantUserId
            ? String(participantUserId) === currentUserIdStr
            : false;
        })
      : false;

    const data = contest.toObject ? contest.toObject() : contest;
    res.json({ success: true, data: { ...data, isRegistered } });
  } catch (err) {
    console.error("Error fetching contest:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getContestLeaderboard = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate(
      "participants.userId",
      "firstName lastName emailId",
    );

    if (!contest) {
      return res
        .status(404)
        .json({ success: false, message: "Contest not found" });
    }

    const pointsByProblemId = new Map(
      (contest.problems || []).map((cp) => [
        String(cp.problemId),
        cp.pointValue || 0,
      ]),
    );

    const totalProblems = Array.isArray(contest.problems)
      ? contest.problems.length
      : 0;

    const leaderboard = (contest.participants || [])
      .map((p) => {
        let totalScore = 0;
        let totalPenaltyTime = 0;
        let totalTimeTaken = 0;
        let solvedCount = 0;

        const stats = p.problemStats || [];
        for (const ps of stats) {
          if (ps.status !== "solved") continue;
          solvedCount += 1;
          const pointValue = pointsByProblemId.get(String(ps.problemId)) || 0;
          const solvedAtDuration = clampTimeTakenMinutes(
            ps.solvedAtDuration ?? 0,
          );
          const wrongAttempts = ps.wrongAttempts ?? 0;

          totalScore += computeEarnedScore(
            pointValue,
            solvedAtDuration,
            wrongAttempts,
          );
          totalPenaltyTime += computePenaltyMinutes(
            solvedAtDuration,
            wrongAttempts,
          );
          totalTimeTaken += Math.floor(solvedAtDuration);
        }

        return {
          user: p.userId,
          solvedCount,
          totalProblems,
          totalScore,
          totalPenaltyTime,
          totalTimeTaken,
        };
      })
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.totalPenaltyTime - b.totalPenaltyTime;
      });

    res.json({
      success: true,
      phase: getContestPhase(contest, Date.now()),
      data: leaderboard,
    });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getGlobalContestLeaderboard = async (req, res) => {
  try {
    const contests = await Contest.find({})
      .select("problems participants")
      .populate("participants.userId", "firstName lastName emailId");

    const totalsByUserId = new Map();

    for (const contest of contests) {
      for (const participant of contest.participants || []) {
        const participantUserId =
          participant?.userId?._id || participant?.userId;
        if (!participantUserId) continue;
        const userIdStr = String(participantUserId);

        const contestScore = Number(participant.totalScore) || 0;
        const contestPenalty = Number(participant.totalPenaltyTime) || 0;

        const prev = totalsByUserId.get(userIdStr) || {
          user: participant.userId,
          totalScore: 0,
          totalPenaltyTime: 0,
        };

        const userObj = prev.user || participant.userId;

        totalsByUserId.set(userIdStr, {
          user: userObj,
          totalScore: prev.totalScore + contestScore,
          totalPenaltyTime: prev.totalPenaltyTime + contestPenalty,
        });
      }
    }

    const rows = Array.from(totalsByUserId.values()).sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (a.totalPenaltyTime !== b.totalPenaltyTime)
        return a.totalPenaltyTime - b.totalPenaltyTime;
      return String(a.user?._id || "").localeCompare(String(b.user?._id || ""));
    });

    const ranked = rows.map((row, idx) => ({
      rank: idx + 1,
      user: row.user,
      totalScore: row.totalScore,
      // Keep penalty in payload for tie-break transparency/debugging (UI may ignore)
      totalPenaltyTime: row.totalPenaltyTime,
    }));

    return res.json({ success: true, data: ranked });
  } catch (err) {
    console.error("Error fetching global contest leaderboard:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.submitContestCode = async (req, res) => {
  try {
    const userId = req.user?._id;
    const contestId = req.params.id;
    const { problemId, code, languageId } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!problemId || !code || !languageId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res
        .status(404)
        .json({ success: false, message: "Contest not found" });
    }

    const isRegistered = (contest.participants || []).some((p) => {
      const participantUserId = p?.userId?._id || p?.userId;
      return participantUserId
        ? String(participantUserId) === String(userId)
        : false;
    });
    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: "You are not registered for this contest",
      });
    }

    const nowMs = Date.now();
    const startMs = new Date(contest.startTime).getTime();
    const endMs = new Date(contest.endTime).getTime();
    if (nowMs < startMs || nowMs > endMs) {
      return res.status(400).json({
        success: false,
        message: "Contest is not live",
        phase: getContestPhase(contest, nowMs),
      });
    }

    const contestProblem = (contest.problems || []).find(
      (p) => String(p.problemId) === String(problemId),
    );
    if (!contestProblem) {
      return res
        .status(400)
        .json({ success: false, message: "Problem not part of contest" });
    }

    const problemObjectId = new mongoose.Types.ObjectId(problemId);

    await ensureProblemStatsForExistingParticipant(
      contestId,
      userId,
      problemObjectId,
    );

    const participant = await getParticipantSnapshot(contestId, userId);
    const existingStat = participant?.problemStats?.find(
      (ps) => String(ps.problemId) === String(problemId),
    );
    const alreadySolved = existingStat?.status === "solved";

    // If startedAt isn't set (older data / user didn't call start endpoint), set it now.
    let startedAtMs = existingStat?.startedAt
      ? new Date(existingStat.startedAt).getTime()
      : null;
    if (!startedAtMs) {
      const nowDate = new Date(nowMs);
      await Contest.updateOne(
        {
          _id: contestId,
          participants: {
            $elemMatch: {
              userId,
              problemStats: {
                $elemMatch: {
                  problemId: problemObjectId,
                  $or: [{ startedAt: null }, { startedAt: { $exists: false } }],
                },
              },
            },
          },
        },
        {
          $set: {
            "participants.$[p].problemStats.$[ps].startedAt": nowDate,
          },
        },
        {
          arrayFilters: [
            { "p.userId": userId },
            { "ps.problemId": problemObjectId },
          ],
        },
      );
      startedAtMs = nowMs;
    }

    const elapsedMs = nowMs - startedAtMs;
    // Small grace to account for timer drift.
    const GRACE_MS = 5000;
    if (elapsedMs > SOLVE_WINDOW_MS + GRACE_MS) {
      return res.status(400).json({
        success: false,
        message: "Time is over for this problem",
      });
    }

    // Judge now (even if already solved, we still store the submission)
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res
        .status(404)
        .json({ success: false, message: "Problem not found" });
    }

    const judgeResult = await judgeAgainstHiddenTests({
      problem,
      sourceCode: code,
      languageId,
    });

    const submissionStatus = judgeResult.status;
    const language = LANGUAGE_NAME_BY_ID[languageId] || String(languageId);

    const submissionDoc = await ContestSubmission.create({
      contestId,
      userId,
      problemId,
      code,
      language,
      status: submissionStatus,
      submittedAt: new Date(nowMs),
    });

    // No score updates if already solved
    if (alreadySolved) {
      const freshParticipant = await getParticipantSnapshot(contestId, userId);
      return res.json({
        success: true,
        message: "Submission recorded (problem already solved)",
        submission: submissionDoc,
        status: submissionStatus,
        participant: freshParticipant,
      });
    }

    if (submissionStatus === "Accepted") {
      const solvedAtDuration = clampTimeTakenMinutes(
        minutesSince(startedAtMs, nowMs),
      );
      const wrongAttempts = existingStat?.wrongAttempts || 0;
      const earnedScore = computeEarnedScore(
        contestProblem.pointValue,
        solvedAtDuration,
        wrongAttempts,
      );
      const penaltyToAdd = computePenaltyMinutes(
        solvedAtDuration,
        wrongAttempts,
      );

      const updateResult = await Contest.updateOne(
        {
          _id: contestId,
          participants: {
            $elemMatch: {
              userId,
              problemStats: {
                $elemMatch: {
                  problemId: problemObjectId,
                  status: { $ne: "solved" },
                },
              },
            },
          },
        },
        {
          $set: {
            "participants.$[p].problemStats.$[ps].status": "solved",
            "participants.$[p].problemStats.$[ps].solvedAtDuration":
              solvedAtDuration,
          },
          $inc: {
            "participants.$[p].totalScore": earnedScore,
            "participants.$[p].totalPenaltyTime": penaltyToAdd,
          },
        },
        {
          arrayFilters: [
            { "p.userId": userId },
            { "ps.problemId": problemObjectId },
          ],
        },
      );

      if (!updateResult.modifiedCount) {
        const freshParticipant = await getParticipantSnapshot(
          contestId,
          userId,
        );
        return res.json({
          success: true,
          message: "Submission recorded",
          submission: submissionDoc,
          status: submissionStatus,
          participant: freshParticipant,
        });
      }

      const freshParticipant = await getParticipantSnapshot(contestId, userId);
      return res.json({
        success: true,
        message: "Accepted",
        submission: submissionDoc,
        status: submissionStatus,
        solvedAtDuration,
        earnedScore,
        penaltyAdded: penaltyToAdd,
        participant: freshParticipant,
      });
    }

    // WA or TLE treated as wrong attempt for stats
    const updateResult = await Contest.updateOne(
      {
        _id: contestId,
        participants: {
          $elemMatch: {
            userId,
            problemStats: {
              $elemMatch: {
                problemId: problemObjectId,
                status: { $ne: "solved" },
              },
            },
          },
        },
      },
      {
        $set: {
          "participants.$[p].problemStats.$[ps].status": "attempted",
        },
        $inc: {
          "participants.$[p].problemStats.$[ps].wrongAttempts": 1,
        },
      },
      {
        arrayFilters: [
          { "p.userId": userId },
          { "ps.problemId": problemObjectId },
        ],
      },
    );

    const freshParticipant = await getParticipantSnapshot(contestId, userId);

    return res.json({
      success: true,
      message: updateResult.modifiedCount
        ? "Wrong attempt recorded"
        : "Submission recorded",
      submission: submissionDoc,
      status: submissionStatus,
      participant: freshParticipant,
    });
  } catch (err) {
    console.error("Error in submitContestCode:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
