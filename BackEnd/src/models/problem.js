const mongoose = require("mongoose");

const testcaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    }
});

const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true
        },

        tags: [String],

        sampleTestcases: [testcaseSchema],

        hiddenTestcases: [testcaseSchema],

        timeLimit: {
            type: Number,
            default: 2 // seconds
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);