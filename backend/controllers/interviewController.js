const Interview = require("../models/Interview");
const InterviewQuestion = require("../models/InterviewQuestion");
const {
  generateInterviewQuestions,
  evaluateInterviewAnswers,
  analyzeProjectReadme,
  generateProjectInterviewQuestions,
  analyzeResumeAndJD,
  generateResumeJDInterviewQuestions,
  
} = require("../services/geminiService");

exports.createInterview = async (req, res) => {
  try {
    const { type, questionCount = 5, isTimed = false } = req.body;

const durationMinutes = isTimed ? questionCount * 2 : 0;

    if (!type) {
      return res.status(400).json({
        message: "Interview type is required",
      });
    }

    const interview = await Interview.create({
  user: req.user._id,
  type,
  isTimed,
  durationMinutes,
  totalQuestions: questionCount,
  status:"in-progress",
  
});


    // --- Feature 2: Fetch bounded previous question history for diversity ---
    const MAX_PREV_INTERVIEWS = 5;
    const MAX_PREV_QUESTIONS = 50;
    const pastInterviews = await Interview.find({
      user: req.user._id,
      type: type,
      _id: { $ne: interview._id },
    })
      .sort({ createdAt: -1 })
      .limit(MAX_PREV_INTERVIEWS)
      .select("_id");

    let previousQuestions = [];
    if (pastInterviews.length > 0) {
      const pastIds = pastInterviews.map((i) => i._id);
      const pastQs = await InterviewQuestion.find({
        interview: { $in: pastIds },
      }).select("question topic");

      previousQuestions = pastQs
        .map((q) => ({ question: q.question, topic: q.topic || "" }))
        .slice(0, MAX_PREV_QUESTIONS);
    }
    // --- End Feature 2 ---

    const generatedData = await generateInterviewQuestions({
      role: "Software Developer",
      topic: type,
      experienceLevel: "Internship / Entry Level",
      questionCount,
      previousQuestions,
    });

    const questions = generatedData.questions.map((item) => ({
      interview: interview._id,
      question: item.question,
      type: item.type,
      difficulty: item.difficulty,
      topic: item.topic || "",
      expectedPoints: item.expectedPoints || [],
    }));
      
    await InterviewQuestion.insertMany(questions);
    interview.totalQuestions = questions.length;
    await interview.save();

    res.status(201).json({
      interview,
      questions,
    });
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "AI quota is exhausted right now. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is temporarily busy. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Failed to create interview",
    });
  }
};

exports.getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch interviews",
    });
  }
};

exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const questions = await InterviewQuestion.find({
      interview: interview._id,
    }).sort({ createdAt: 1 });

    res.json({
      interview,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch interview",
    });
  }
};

exports.saveAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer, speechMetrics } = req.body;

    const question = await InterviewQuestion.findById(questionId).populate(
      "interview"
    );

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }
    
    // check if the interview to which this question belongs is of the current logged in user 
    if (question.interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    question.answer = answer || "";

    if (speechMetrics && speechMetrics.answeredViaVoice) {
      question.speechMetrics = {
        answeredViaVoice: true,
        totalDuration: speechMetrics.totalDuration || 0,
        wordCount: speechMetrics.wordCount || 0,
        wordsPerMinute: speechMetrics.wordsPerMinute || 0,
        pauseCount: speechMetrics.pauseCount || 0,
        fillerWordCount: speechMetrics.fillerWordCount || 0,
        fillerWordDetails: speechMetrics.fillerWordDetails || {},
      };
    }

    await question.save();

    const answeredCount = await InterviewQuestion.countDocuments({
      interview: question.interview._id,
      answer: { $ne: "" },
    });

    await Interview.findByIdAndUpdate(question.interview._id, {
      completedQuestions: answeredCount,
    });

    res.json({
      message: "Answer saved",
      question,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to save answer",
    });
  }
};


exports.submitInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const questions = await InterviewQuestion.find({
      interview: interview._id,
    });

    const evaluation = await evaluateInterviewAnswers({ questions });

    let totalScore = 0;
    const weakAreas = [];

    for (const result of evaluation.results) {
      const question = questions.find(
        (item) => item._id.toString() === result.questionId
      );

      if (!question) continue;

      const rawScore = Number(result.score) || 0;
const normalizedScore = rawScore <= 10 ? rawScore * 10 : rawScore;

question.score = Math.min(Math.max(normalizedScore, 0), 100);
question.feedback = result.feedback || "";
question.coveredPoints = Array.isArray(result.coveredPoints) ? result.coveredPoints : [];
question.missedPoints = Array.isArray(result.missedPoints) ? result.missedPoints : [];
if (result.communicationFeedback) {
  question.communicationFeedback = result.communicationFeedback;
}
await question.save();

totalScore += question.score;

      if (Array.isArray(result.weakAreas)) {
        weakAreas.push(...result.weakAreas);
      }
    }

    interview.score = Math.round(
      totalScore / Math.max(evaluation.results.length, 1)
    );
    interview.status = "completed";
    interview.feedback = evaluation.overallFeedback || "";
    interview.weakAreas = [
      ...new Set([
        ...weakAreas,
        ...(evaluation.overallWeakAreas || []),
      ]),
    ];
    interview.strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths : [];
    interview.preparationSuggestions = Array.isArray(evaluation.preparationSuggestions) ? evaluation.preparationSuggestions : [];

    await interview.save();

    res.json({
      message: "Interview evaluated successfully",
      interview,
    });
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "AI quota is exhausted right now. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is temporarily busy. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Failed to evaluate interview",
    });
  }
};

exports.analyzeReadme = async (req, res) => {
  try {
    const { readme } = req.body;

    const result = await analyzeProjectReadme({
      readme,
    });

    res.json(result);
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "AI quota is exhausted right now. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is temporarily busy. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Failed to analyze README",
    });
  }
};

exports.createProjectInterview = async (req, res) => {
  try {
    const {
      projectName,
      description,
      techStack,
      features,
      challenges,
      difficulty = "medium",
      
    } = req.body;

    

    const interview = await Interview.create({
      user: req.user._id,
      type: "Project-Based",
      
      projectName,
      projectDescription: description,
      projectTechStack: techStack,
      projectFeatures: features,
      projectChallenges: challenges,
      
    });

    // --- Feature 2: Fetch bounded previous question history for diversity ---
    const MAX_PREV_INTERVIEWS = 5;
    const MAX_PREV_QUESTIONS = 50;
    const pastInterviews = await Interview.find({
      user: req.user._id,
      type: "Project-Based",
      _id: { $ne: interview._id },
    })
      .sort({ createdAt: -1 })
      .limit(MAX_PREV_INTERVIEWS)
      .select("_id");

    let previousQuestions = [];
    if (pastInterviews.length > 0) {
      const pastIds = pastInterviews.map((i) => i._id);
      const pastQs = await InterviewQuestion.find({
        interview: { $in: pastIds },
      }).select("question topic");

      previousQuestions = pastQs
        .map((q) => ({ question: q.question, topic: q.topic || "" }))
        .slice(0, MAX_PREV_QUESTIONS);
    }
    // --- End Feature 2 ---

    const generatedData = await generateProjectInterviewQuestions({
      projectName,
      description,
      techStack,
      features,
      challenges,
      difficulty,
      questionCount: 5,
      previousQuestions,
    });

    const questions = generatedData.questions.map((item) => ({
      interview: interview._id,
      question: item.question,
      type: item.type,
      difficulty: item.difficulty,
      topic: item.topic || "",
      expectedPoints: item.expectedPoints || [],
    }));

    await InterviewQuestion.insertMany(questions);
    interview.totalQuestions = questions.length;
    await interview.save();

    res.status(201).json({
      interview,
      questions,
    });
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "AI quota is exhausted right now. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is temporarily busy. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Failed to create project interview",
    });
  }
};

exports.getInterviewSummary = async (req, res) => {
  try {
    const interviews = await Interview.find({
      user: req.user._id,
    });

    const completedInterviews = interviews.filter(
      (interview) => interview.status === "completed"
    );

    const totalInterviews = interviews.length;

    const averageScore =
      completedInterviews.length > 0
        ? Math.round(
            completedInterviews.reduce(
              (sum, interview) => sum + interview.score,
              0
            ) / completedInterviews.length
          )
        : 0;

    const bestScore =
      completedInterviews.length > 0
        ? Math.max(...completedInterviews.map((interview) => interview.score))
        : 0;

    const weakAreaCounts = {};

    completedInterviews.forEach((interview) => {
      interview.weakAreas.forEach((area) => {
        weakAreaCounts[area] = (weakAreaCounts[area] || 0) + 1;
      });
    });

    const topWeakAreas = Object.entries(weakAreaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area);

    res.json({
      totalInterviews,
      completedInterviews: completedInterviews.length,
      averageScore,
      bestScore,
      weakAreas: topWeakAreas,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch interview summary",
    });
  }
};
exports.getInterviewAnalytics = async (req, res) => {
  try {
    const interviews = await Interview.find({
      user: req.user._id,
    }).sort({ createdAt: 1 });

    const completedInterviews = interviews.filter(
      (interview) => interview.status === "completed"
    );

    const typeStats = {};

    completedInterviews.forEach((interview) => {
      if (!typeStats[interview.type]) {
        typeStats[interview.type] = {
          type: interview.type,
          total: 0,
          averageScore: 0,
          bestScore: 0,
        };
      }

      typeStats[interview.type].total += 1;
      typeStats[interview.type].averageScore += interview.score;
      typeStats[interview.type].bestScore = Math.max(
        typeStats[interview.type].bestScore,
        interview.score
      );
    });

    const topicPerformance = Object.values(typeStats).map((item) => ({
      ...item,
      averageScore: Math.round(item.averageScore / item.total),
    }));

    const scoreTrend = completedInterviews.map((interview) => ({
      id: interview._id,
      type: interview.type,
      projectName: interview.projectName,
      score: interview.score,
      date: interview.createdAt,
    }));

    const recentActivity = interviews
      .slice(-5)
      .reverse()
      .map((interview) => ({
        id: interview._id,
        type: interview.type,
        status: interview.status,
        score: interview.score,
        projectName: interview.projectName,
        date: interview.createdAt,
      }));

    res.json({
      totalAttempts: interviews.length,
      completedAttempts: completedInterviews.length,
      topicPerformance,
      scoreTrend,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch interview analytics",
    });
  }
};

// ===== Feature 3: Resume + JD Controllers =====

exports.analyzeResumeJD = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({
        message: "Resume text is required. Please paste your resume content.",
      });
    }

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        message: "Job description is required. Please paste the job description.",
      });
    }

    const result = await analyzeResumeAndJD({
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
    });

    res.json(result);
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "AI quota is exhausted right now. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is temporarily busy. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Failed to analyze resume and job description",
    });
  }
};

exports.createResumeJDInterview = async (req, res) => {
  try {
    const {
      resumeText,
      jobDescription,
      resumeAnalysis,
      jdAnalysis,
      matchingSkills,
      missingSkills,
      preparationInsights,
      questionCount = 5,
      difficulty = "medium",
    } = req.body;

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({
        message: "Resume text is required.",
      });
    }

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        message: "Job description is required.",
      });
    }

    if (!resumeAnalysis || !jdAnalysis) {
      return res.status(400).json({
        message: "Resume and JD analysis data is required. Please analyze first.",
      });
    }

    const interview = await Interview.create({
      user: req.user._id,
      type: "Resume-JD",
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
      resumeAnalysis,
      jdAnalysis,
      matchingSkills: matchingSkills || [],
      missingSkills: missingSkills || [],
      preparationInsights: preparationInsights || {},
      totalQuestions: questionCount,
      status: "in-progress",
    });

    // --- Feature 2: Fetch bounded previous question history for diversity ---
    const MAX_PREV_INTERVIEWS = 5;
    const MAX_PREV_QUESTIONS = 50;
    const pastInterviews = await Interview.find({
      user: req.user._id,
      type: "Resume-JD",
      _id: { $ne: interview._id },
    })
      .sort({ createdAt: -1 })
      .limit(MAX_PREV_INTERVIEWS)
      .select("_id");

    let previousQuestions = [];
    if (pastInterviews.length > 0) {
      const pastIds = pastInterviews.map((i) => i._id);
      const pastQs = await InterviewQuestion.find({
        interview: { $in: pastIds },
      }).select("question topic");

      previousQuestions = pastQs
        .map((q) => ({ question: q.question, topic: q.topic || "" }))
        .slice(0, MAX_PREV_QUESTIONS);
    }
    // --- End Feature 2 ---

    const generatedData = await generateResumeJDInterviewQuestions({
      resumeAnalysis,
      jdAnalysis,
      matchingSkills: matchingSkills || [],
      missingSkills: missingSkills || [],
      questionCount,
      difficulty,
      previousQuestions,
    });

    const questions = generatedData.questions.map((item) => ({
      interview: interview._id,
      question: item.question,
      type: item.type,
      difficulty: item.difficulty,
      topic: item.topic || "",
      expectedPoints: item.expectedPoints || [],
    }));

    await InterviewQuestion.insertMany(questions);
    interview.totalQuestions = questions.length;
    await interview.save();

    res.status(201).json({
      interview,
      questions,
    });
  } catch (error) {
    console.error(error);

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "AI quota is exhausted right now. Please try again later.",
      });
    }

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is temporarily busy. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Failed to create personalized interview",
    });
  }
};
