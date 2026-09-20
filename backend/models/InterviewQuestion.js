const mongoose = require("mongoose");

const interviewQuestionSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["technical", "behavioral", "practical"],
      default: "technical",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    topic: {
      type: String,
      default: "",
    },

    expectedPoints: {
      type: [String],
      default: [],
    },

    coveredPoints: {
      type: [String],
      default: [],
    },

    missedPoints: {
      type: [String],
      default: [],
    },

    answer: {
      type: String,
      default: "",
    },

    speechMetrics: {
      answeredViaVoice: { type: Boolean, default: false },
      totalDuration: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
      wordsPerMinute: { type: Number, default: 0 },
      pauseCount: { type: Number, default: 0 },
      fillerWordCount: { type: Number, default: 0 },
      fillerWordDetails: { type: Map, of: Number, default: {} },
    },

    score: {
      type: Number,
      default: 0,
    },

    feedback: {
      type: String,
      default: "",
    },

    communicationFeedback: {
      type: String,
      default: "",
    },


  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InterviewQuestion",
  interviewQuestionSchema
);