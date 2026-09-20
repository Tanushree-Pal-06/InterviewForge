require('dotenv').config();
const mongoose = require('mongoose');
const InterviewQuestion = require('./models/InterviewQuestion');
const { evaluateInterviewAnswers } = require('./services/geminiService');

async function runTests() {
  console.log("Starting backend tests...");
  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    // Test 1: Model validation with speechMetrics
    const testQuestion = new InterviewQuestion({
      interview: new mongoose.Types.ObjectId(),
      question: "What is your favorite programming language?",
      answer: "I really like JavaScript because it is versatile.",
      expectedPoints: ["JavaScript", "versatile"],
      speechMetrics: {
        answeredViaVoice: true,
        totalDuration: 15000,
        wordCount: 8,
        wordsPerMinute: 32,
        pauseCount: 1,
        fillerWordCount: 2,
        fillerWordDetails: { "um": 2 }
      }
    });
    
    // Check if the model can be validated
    const validationError = testQuestion.validateSync();
    if (validationError) {
      console.error("Test 1 Failed: Model validation error:", validationError);
    } else {
      console.log("Test 1 Passed: InterviewQuestion model supports speechMetrics.");
    }

    // Test 2: Gemini Service Evaluation
    console.log("Testing Gemini Evaluation with speech metrics...");
    const mockQuestions = [
      {
        _id: new mongoose.Types.ObjectId(),
        question: "Explain closures in JavaScript.",
        answer: "Um, basically, a closure is when a function remembers its lexical scope, even when executed outside that scope. Uh, yeah.",
        expectedPoints: ["lexical scope", "function inside a function", "access to outer variables"],
        speechMetrics: {
          answeredViaVoice: true,
          totalDuration: 25000,
          wordCount: 22,
          wordsPerMinute: 53,
          pauseCount: 2,
          fillerWordCount: 3,
          fillerWordDetails: { "um": 1, "uh": 2 }
        }
      }
    ];

    const evaluation = await evaluateInterviewAnswers({ questions: mockQuestions });
    
    if (evaluation && evaluation.results && evaluation.results.length > 0) {
      const result = evaluation.results[0];
      console.log("Gemini Feedback Received:");
      console.log("Score:", result.score);
      console.log("Content Feedback:", result.feedback);
      console.log("Communication Feedback:", result.communicationFeedback);
      
      if (result.communicationFeedback) {
        console.log("Test 2 Passed: Gemini returned communication feedback.");
      } else {
        console.error("Test 2 Failed: No communication feedback returned from Gemini.");
      }
    } else {
      console.error("Test 2 Failed: Invalid evaluation format returned from Gemini.");
    }

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from DB.");
    }
  }
}

runTests();
