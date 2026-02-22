const mongoose = require("mongoose");

const testcaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
});

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    constraints: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "constraints are required",
      },
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    tags: [String],

    patterns: [String],

    sampleTestcases: [testcaseSchema],

    hiddenTestcases: [testcaseSchema],

    timeLimit: {
      type: Number,
      default: 2, // seconds
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Problem", problemSchema);
