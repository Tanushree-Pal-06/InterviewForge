const express = require("express");
const {
  createInterview,
  getMyInterviews,
  getInterviewById,
  saveAnswer,
  
  submitInterview,
  analyzeReadme,
  createProjectInterview,
  getInterviewSummary,
  getInterviewAnalytics,
  analyzeResumeJD,
  createResumeJDInterview,
} = require("../controllers/interviewController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createInterview);

router.get("/analytics", protect, getInterviewAnalytics);
router.get("/summary", protect, getInterviewSummary);
router.get("/my", protect, getMyInterviews);
router.get("/:id", protect, getInterviewById);
router.put("/questions/:questionId/answer", protect, saveAnswer);

router.post("/:id/submit", protect, submitInterview);
router.post("/analyze-readme", protect, analyzeReadme);
router.post(
  "/project-interview",
  protect,
  createProjectInterview
);
router.post("/analyze-resume-jd", protect, analyzeResumeJD);
router.post("/resume-jd-interview", protect, createResumeJDInterview);

module.exports = router;
