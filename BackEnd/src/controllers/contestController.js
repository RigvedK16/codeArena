const axios = require("axios");
const mongoose = require("mongoose");
const Contest = require("../models/contest");
const ContestSubmission = require("../models/contestSubmission");
const Problem = require("../models/problem");

const JUDGE0_URL = "https://ce.judge0.com/submissions/?base64_encoded=false&wait=true";

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
      }
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

async function ensureParticipantAndProblemStats(contestId, userId, problemObjectId) {
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
    }
  );

  // Create problemStats entry if missing for this participant
  await Contest.updateOne(
    {
      _id: contestId,
      participants: {
        $elemMatch: {
          userId,
          problemStats: { $not: { $elemMatch: { problemId: problemObjectId } } },
        },
      },
    },
    {
      $push: {
        "participants.$.problemStats": {
          problemId: problemObjectId,
          status: "unsolved",
          solvedAtDuration: null,
          wrongAttempts: 0,
        },
      },
    }
  );
}

exports.listContests = async (req, res) => {
  try {
    const contests = await Contest.find({})
      .select("title description startTime endTime createdBy problems participants")
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
      })),
    });
  } catch (err) {
    console.error("Error listing contests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("problems.problemId", "title difficulty tags timeLimit");

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    res.json({ success: true, data: contest });
  } catch (err) {
    console.error("Error fetching contest:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getContestLeaderboard = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate(
      "participants.userId",
      "firstName lastName emailId"
    );

    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
    }

    const leaderboard = (contest.participants || [])
      .map((p) => ({
        user: p.userId,
        totalScore: p.totalScore || 0,
        totalPenaltyTime: p.totalPenaltyTime || 0,
      }))
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

exports.submitContestCode = async (req, res) => {
  try {
    const userId = req.user?._id;
    const contestId = req.params.id;
    const { problemId, code, languageId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!problemId || !code || !languageId) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found" });
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
      (p) => String(p.problemId) === String(problemId)
    );
    if (!contestProblem) {
      return res.status(400).json({ success: false, message: "Problem not part of contest" });
    }

    const problemObjectId = new mongoose.Types.ObjectId(problemId);
    await ensureParticipantAndProblemStats(contestId, userId, problemObjectId);

    const participant = (contest.participants || []).find(
      (p) => String(p.userId) === String(userId)
    );
    const existingStat = participant?.problemStats?.find(
      (ps) => String(ps.problemId) === String(problemId)
    );
    const alreadySolved = existingStat?.status === "solved";

    // Judge now (even if already solved, we still store the submission)
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
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
      return res.json({
        success: true,
        message: "Submission recorded (problem already solved)",
        submission: submissionDoc,
        status: submissionStatus,
      });
    }

    if (submissionStatus === "Accepted") {
      const solvedAtDuration = minutesFromStart(contest, nowMs);
      const wrongAttempts = existingStat?.wrongAttempts || 0;
      const penaltyToAdd = solvedAtDuration + wrongAttempts * 20;

      const updateResult = await Contest.updateOne(
        {
          _id: contestId,
          participants: {
            $elemMatch: {
              userId,
              problemStats: {
                $elemMatch: { problemId: problemObjectId, status: { $ne: "solved" } },
              },
            },
          },
        },
        {
          $set: {
            "participants.$[p].problemStats.$[ps].status": "solved",
            "participants.$[p].problemStats.$[ps].solvedAtDuration": solvedAtDuration,
          },
          $inc: {
            "participants.$[p].totalScore": contestProblem.pointValue,
            "participants.$[p].totalPenaltyTime": penaltyToAdd,
          },
        },
        {
          arrayFilters: [{ "p.userId": userId }, { "ps.problemId": problemObjectId }],
        }
      );

      if (!updateResult.modifiedCount) {
        return res.json({
          success: true,
          message: "Submission recorded",
          submission: submissionDoc,
          status: submissionStatus,
        });
      }

      return res.json({
        success: true,
        message: "Accepted",
        submission: submissionDoc,
        status: submissionStatus,
        solvedAtDuration,
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
              $elemMatch: { problemId: problemObjectId, status: { $ne: "solved" } },
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
        arrayFilters: [{ "p.userId": userId }, { "ps.problemId": problemObjectId }],
      }
    );

    return res.json({
      success: true,
      message: updateResult.modifiedCount ? "Wrong attempt recorded" : "Submission recorded",
      submission: submissionDoc,
      status: submissionStatus,
    });
  } catch (err) {
    console.error("Error in submitContestCode:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
