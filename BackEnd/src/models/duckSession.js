const mongoose = require("mongoose");

const duckMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const duckSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    chatHistory: {
      type: [duckMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

duckSessionSchema.index({ userId: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model("DuckSession", duckSessionSchema);
