import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  getInterviewById,
  saveAnswer,
  submitInterview,
  
} from "../api/interviewApi";
import Navbar from "../components/Navbar";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

function InterviewSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [errorModal, setErrorModal] = useState("");
  const [error, setError] = useState("");
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);


  // Per-question speech metrics stored by question ID
  const [speechMetricsMap, setSpeechMetricsMap] = useState({});

  const {
    status: speechStatus,
    transcript: speechTranscript,
    interimTranscript,
    errorMessage: speechError,
    metrics: speechMetrics,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetSpeech,
    clearError,
  } = useSpeechRecognition();

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  const panelClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const innerCardClass = isDark
    ? "border-slate-800 bg-slate-950"
    : "border-slate-200 bg-slate-50";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const pillClass = isDark
    ? "bg-slate-950 text-slate-300"
    : "bg-slate-100 text-slate-700";

  const secondaryPillClass = isDark
    ? "bg-slate-800 text-slate-300"
    : "bg-slate-200 text-slate-700";

  const modalClass = isDark
    ? "border-slate-800 bg-slate-900 text-white"
    : "border-slate-200 bg-white text-slate-950";

  useEffect(() => {
    async function loadInterview() {
      try {
        const data = await getInterviewById(id, token);
        setInterview(data.interview);

        if (data.interview?.isTimed) {
          setTimeLeft(data.interview.durationMinutes * 60);
        }

        setQuestions(data.questions || []);

        const savedAnswers = {};
        data.questions?.forEach((q) => {
          savedAnswers[q._id] = q.answer || "";
        });

        setAnswers(savedAnswers);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadInterview();
  }, [id, token]);

  useEffect(() => {
    if (!interview?.isTimed || timeLeft === null) {
      return;
    }

    if (timeLeft <= 0) {
      setShowTimeUpModal(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, interview]);

  const currentQuestion = questions[currentIndex];

  // When speech transcript updates, append it to the current answer
  useEffect(() => {
    if (speechTranscript && currentQuestion) {
      setAnswers((prev) => {
        const existing = prev[currentQuestion._id] || "";
        // Only update if transcript adds new content
        const trimmedExisting = existing.trimEnd();
        const separator = trimmedExisting ? " " : "";
        const newAnswer = trimmedExisting + separator + speechTranscript.trim();
        return {
          ...prev,
          [currentQuestion._id]: newAnswer,
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechTranscript]);

  // When speech metrics are computed (after stopping), store them for the current question
  useEffect(() => {
    if (speechMetrics && currentQuestion) {
      setSpeechMetricsMap((prev) => ({
        ...prev,
        [currentQuestion._id]: speechMetrics,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechMetrics]);

  // Reset speech state when switching questions
  useEffect(() => {
    resetSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleAnswerChange = async (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: value,
    }));

    try {
      const metricsForQuestion = speechMetricsMap[currentQuestion._id] || null;
      await saveAnswer(currentQuestion._id, value, token, metricsForQuestion);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveCurrentAnswer = useCallback(async () => {
    if (!currentQuestion) return;
    const currentAnswer = answers[currentQuestion._id] || "";
    const metricsForQuestion = speechMetricsMap[currentQuestion._id] || null;
    try {
      await saveAnswer(currentQuestion._id, currentAnswer, token, metricsForQuestion);
    } catch (error) {
      console.error(error);
    }
  }, [currentQuestion, answers, speechMetricsMap, token]);

  // After voice recording stops and metrics are available, auto-save
  useEffect(() => {
    if (speechMetrics && currentQuestion) {
      handleSaveCurrentAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechMetrics]);

  const handleSubmitInterview = async () => {
    try {
      setSubmitting(true);
      await submitInterview(id, token);
      navigate(`/report/${id}`);
    } catch (error) {
      console.error(error);
      setErrorModal(error.message);
      setError(error.message);
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
      setShowTimeUpModal(false);
    }
  };

  

  const handleMicClick = () => {
    if (speechStatus === "listening") {
      stopListening();
    } else {
      clearError();
      startListening();
    }
  };

  // Format duration from ms to readable string
  const formatDuration = (ms) => {
    if (!ms) return "0s";
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className={pageClass}>
        <Navbar />
        <main className="p-10">Loading interview...</main>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={pageClass}>
        <Navbar />
        <main className="p-10">No questions found.</main>
      </div>
    );
  }

  const currentMetrics = speechMetricsMap[currentQuestion._id];

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="p-6">
        <div className="mx-auto max-w-5xl">
          <div className={`mt-6 rounded-3xl border p-8 ${panelClass}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                  Interview Session
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                  {interview?.type === "Project-Based"
                    ? `${interview?.projectName} Project Interview`
                    : interview?.type === "Resume-JD"
                    ? "Resume + JD Personalized Interview"
                    : `${interview?.type} Interview`}
                </h1>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className={`rounded-full px-4 py-2 text-sm ${pillClass}`}>
                  Question {currentIndex + 1} of {questions.length}
                </div>

                {interview?.isTimed && timeLeft !== null && (
                  <div className="rounded-full border border-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-400">
                    {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                    {String(timeLeft % 60).padStart(2, "0")}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`mt-8 h-2 rounded-full ${
                isDark ? "bg-slate-800" : "bg-slate-200"
              }`}
            >
              <div
                className="h-2 rounded-full bg-cyan-400"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <div className={`mt-8 rounded-2xl border p-6 ${innerCardClass}`}>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950">
                  Q{currentIndex + 1}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs ${secondaryPillClass}`}
                >
                  {currentQuestion.type}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs ${secondaryPillClass}`}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-semibold leading-relaxed">
                {currentQuestion.question}
              </h2>

              <textarea
                value={answers[currentQuestion._id] || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
                rows="8"
                placeholder="Write your answer here or use the microphone to speak..."
                className={`mt-6 w-full resize-none rounded-2xl border p-4 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 ${
                  isDark
                    ? "border-slate-800 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-950"
                }`}
              />

              {/* Interim transcript shown while listening */}
              {speechStatus === "listening" && interimTranscript && (
                <p
                  className={`mt-2 text-sm italic ${mutedTextClass}`}
                  style={{ opacity: 0.7 }}
                >
                  {interimTranscript}...
                </p>
              )}

              {/* Voice Input Controls */}
              {isSpeechSupported && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    id="voice-input-btn"
                    onClick={handleMicClick}
                    disabled={submitting}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      speechStatus === "listening"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600"
                        : isDark
                        ? "border border-slate-700 bg-slate-800 text-slate-200 hover:border-cyan-400 hover:text-cyan-400"
                        : "border border-slate-300 bg-slate-100 text-slate-700 hover:border-cyan-500 hover:text-cyan-600"
                    }`}
                    title={
                      speechStatus === "listening"
                        ? "Stop recording"
                        : "Start voice input"
                    }
                  >
                    {/* Microphone SVG Icon */}
                    {speechStatus === "listening" ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                        <span>Stop Recording</span>
                        <span
                          className="ml-1 inline-block h-2 w-2 rounded-full bg-white"
                          style={{
                            animation: "pulse 1s ease-in-out infinite",
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                        <span>Voice Input</span>
                      </>
                    )}
                  </button>

                  {/* Status indicator */}
                  {speechStatus === "listening" && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400">
                      <span
                        className="inline-block h-2 w-2 rounded-full bg-red-400"
                        style={{
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      />
                      Listening...
                    </span>
                  )}
                </div>
              )}

              {/* Unsupported browser notice */}
              {!isSpeechSupported && (
                <div
                  className={`mt-4 rounded-xl border p-3 text-sm ${
                    isDark
                      ? "border-yellow-800 bg-yellow-950/50 text-yellow-300"
                      : "border-yellow-300 bg-yellow-50 text-yellow-700"
                  }`}
                >
                  🎤 Voice input is not available in this browser. Please use
                  Chrome or Edge for voice answering, or type your answer
                  manually.
                </div>
              )}

              {/* Speech error message */}
              {speechError && (
                <div
                  className={`mt-3 flex items-center justify-between rounded-xl border p-3 text-sm ${
                    isDark
                      ? "border-red-800 bg-red-950/50 text-red-300"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  <span>{speechError}</span>
                  <button
                    onClick={clearError}
                    className="ml-3 text-xs font-semibold underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Speech metrics summary (shown after recording) */}
              {currentMetrics && (
                <div
                  className={`mt-4 rounded-xl border p-4 ${
                    isDark
                      ? "border-slate-700 bg-slate-800/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Voice Input Summary
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className={mutedTextClass}>Duration: </span>
                      <span className="font-medium">
                        {formatDuration(currentMetrics.totalDuration)}
                      </span>
                    </div>
                    <div>
                      <span className={mutedTextClass}>Words: </span>
                      <span className="font-medium">
                        {currentMetrics.wordCount}
                      </span>
                    </div>
                    <div>
                      <span className={mutedTextClass}>~WPM: </span>
                      <span className="font-medium">
                        {currentMetrics.wordsPerMinute}
                      </span>
                    </div>
                    <div>
                      <span className={mutedTextClass}>Pauses: </span>
                      <span className="font-medium">
                        {currentMetrics.pauseCount}
                      </span>
                    </div>
                    <div>
                      <span className={mutedTextClass}>Filler words: </span>
                      <span className="font-medium">
                        {currentMetrics.fillerWordCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-4">
              <button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
                className={`rounded-xl border px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                  isDark
                    ? "border-slate-700 text-slate-300"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                 onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
                >
                Next Question
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950"
                >
                  Submit Interview
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${modalClass}`}
          >
            <h2 className="text-xl font-bold">Submit Interview?</h2>

            <p className={`mt-3 text-sm ${mutedTextClass}`}>
              Your answers will be evaluated now. After submission, you cannot
              edit this interview attempt.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className={`rounded-xl border px-4 py-2 disabled:opacity-60 ${
                  isDark
                    ? "border-slate-700 text-slate-300 hover:border-slate-500"
                    : "border-slate-300 text-slate-700 hover:border-slate-500"
                }`}
              >
                Cancel Submission
              </button>

              <button
                onClick={handleSubmitInterview}
                disabled={submitting}
                className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${modalClass}`}
          >
            <h2 className="text-xl font-bold text-cyan-400">Time Up</h2>

            <p className={`mt-3 text-sm ${mutedTextClass}`}>
              Your interview time has ended. Submit your answers now to generate
              the report.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmitInterview}
                disabled={submitting}
                className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Interview"}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${
              isDark ? "border-red-900 bg-slate-900" : "border-red-200 bg-white"
            }`}
          >
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-red-400" : "text-red-600"
              }`}
            >
              AI Evaluation Unavailable
            </h2>

            <p className="mt-4 text-slate-300">{errorModal}</p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setErrorModal("")}
                className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS animation for the pulsing recording indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

export default InterviewSessionPage;
