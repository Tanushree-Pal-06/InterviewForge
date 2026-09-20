const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
  "DSA",
  "Frontend",
  "Backend",
  "DBMS",
  "OS",
  "OOP",
  "HR",
  "Project-Based",
  "Resume-JD",
  
],
    },

    status: {
      type: String,
      enum: ["pending","in-progress", "completed"],
      default: "pending",
    },

    score: {
      type: Number,
      default: 0,
    },

    weakAreas: [
      {
        type: String,
      },
    ],
    projectName: {
  type: String,
  default: "",
},

projectDescription: {
  type: String,
  default: "",
},

projectTechStack: {
  type: [String],
  default: [],
},

projectFeatures: {
  type: [String],
  default: [],
},

projectChallenges: {
  type: [String],
  default: [],
},

    // ===== Feature 3: Resume + JD fields =====
    resumeText: {
      type: String,
      default: "",
    },

    jobDescription: {
      type: String,
      default: "",
    },

    resumeAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    jdAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    matchingSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    preparationInsights: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // ===== End Feature 3 fields =====

    totalQuestions: {
      type: Number,
      default: 0,
    },

    completedQuestions: {
      type: Number,
      default: 0,
    },

    isTimed: {
  type: Boolean,
  default: false,
},

durationMinutes: {
  type: Number,
  default: 0,
}, 

    strengths: [
      {
        type: String,
      },
    ],

    preparationSuggestions: [
      {
        type: String,
      },
    ],

    feedback: {
      type: String,
      default: "",
    },

  },
  { timestamps: true } // with timestamps-> Mongoose automatically gives every document createdAt and updatedAt.
);

module.exports = mongoose.model("Interview", interviewSchema);