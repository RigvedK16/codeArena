const mongoose = require("mongoose");

const contestProblemSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    pointValue: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const participantProblemStatSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    status: {
      type: String,
      enum: ["unsolved", "attempted", "solved"],
      default: "unsolved",
    },
    // When the user started solving this problem in the contest.
    startedAt: {
      type: Date,
      default: null,
    },
    // minutes from contest start, Math.floor-based
    solvedAtDuration: {
      type: Number,
      default: null,
      min: 0,
    },
    wrongAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPenaltyTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    fullscreenViolations: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastFullscreenViolationAt: {
      type: Date,
      default: null,
    },
    problemStats: {
      type: [participantProblemStatSchema],
      default: [],
    },
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problems: {
      type: [contestProblemSchema],
      default: [],
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contest", contestSchema);
