const mongoose = require("mongoose");

const contestSubmissionSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Accepted", "WA", "TLE"],
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

contestSubmissionSchema.index({ contestId: 1, userId: 1, problemId: 1, submittedAt: -1 });

module.exports = mongoose.model("ContestSubmission", contestSubmissionSchema);
