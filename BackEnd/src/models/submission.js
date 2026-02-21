const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true
        },

        sourceCode: {
            type: String,
            required: true
        },

        languageId: {
            type: Number,
            required: true
        },

        verdict: {
            type: String,
            enum: [
                "Accepted",
                "Wrong Answer",
                "Runtime Error",
                "Time Limit Exceeded"
            ]
        },

        passedTestcases: {
            type: Number,
            default: 0
        },

        totalTestcases: {
            type: Number,
            default: 0
        },

        runtime: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);