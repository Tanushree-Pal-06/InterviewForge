import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { createInterview } from "../api/interviewApi";
import Navbar from "../components/Navbar";
import MessageCard from "../components/MessageCard";

const interviewTypes = [
  "DSA",
  "Frontend",
  "Backend",
  "DBMS",
  "OS",
  "OOP",
  "HR",
  "Project-Based",
  "Resume-JD",
];

function InterviewPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [selectedType, setSelectedType] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [isTimed, setIsTimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  const panelClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const optionClass = (active) =>
    active
      ? "border-cyan-400 bg-cyan-400 text-slate-950"
      : isDark
        ? "border-slate-800 bg-slate-950 hover:border-cyan-400"
        : "border-slate-200 bg-slate-50 hover:border-cyan-400";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const handleCreateInterview = async () => {
    if (selectedType === "Project-Based") {
      setIsTimed(false);
      navigate("/project-interview");
      return;
    }

    if (selectedType === "Resume-JD") {
      setIsTimed(false);
      navigate("/resume-jd-interview");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const interview = await createInterview(
        selectedType,
        questionCount,
        isTimed,
        token,
      );

      navigate(`/interview/session/${interview.interview._id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="p-6">
        <div className="mx-auto max-w-6xl">
          <div className={`mt-6 rounded-3xl border p-8 ${panelClass}`}>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              New Interview
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Choose your interview type
            </h1>

            <p className={`mt-3 ${mutedTextClass}`}>
              Select a topic and create your first practice session.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {interviewTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-2xl border p-5 text-left transition ${optionClass(
                    selectedType === type,
                  )}`}
                >
                  <h2 className="text-lg font-semibold">{type}</h2>
                  <p className="mt-2 text-sm opacity-70">
                    Practice {type} questions
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold">Question Count</h2>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                Choose how many questions you want in this session.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[5, 10, 15].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`rounded-2xl border p-5 text-left transition ${optionClass(
                      questionCount === count,
                    )}`}
                  >
                    <h3 className="text-lg font-semibold">{count} Questions</h3>
                    <p className="mt-2 text-sm opacity-70">
                      {count === 5 && "Quick practice"}
                      {count === 10 && "Balanced session"}
                      {count === 15 && "Full mock round"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`mt-8 rounded-2xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Timer</h2>

                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    {selectedType === "Project-Based" || selectedType === "Resume-JD"
                      ? `Timer is not available for ${selectedType.toLowerCase()} interviews.`
                      : "Turn on a countdown timer for this interview."}
                  </p>

                  <p className="mt-2 text-sm text-cyan-400">
                    {selectedType === "Project-Based" || selectedType === "Resume-JD"
                      ? `${selectedType} interviews are untimed.`
                      : isTimed
                        ? `${questionCount * 2} minutes will be given for this session.`
                        : "Timer is off for this session."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={selectedType === "Project-Based" || selectedType === "Resume-JD"}
                  onClick={() => {
                    if (selectedType !== "Project-Based" && selectedType !== "Resume-JD") {
                      setIsTimed(!isTimed);
                    }
                  }}
                  className={`rounded-xl px-5 py-3 font-semibold ${
                    selectedType === "Project-Based" || selectedType === "Resume-JD"
                      ? "cursor-not-allowed border border-slate-700 text-slate-500"
                      : isTimed
                        ? "bg-cyan-400 text-slate-950"
                        : isDark
                          ? "border border-slate-700 text-slate-300"
                          : "border border-slate-300 text-slate-700"
                  }`}
                >
                  {selectedType === "Project-Based" || selectedType === "Resume-JD"
                    ? "Unavailable"
                    : isTimed
                      ? "Timer On"
                      : "Timer Off"}
                </button>
              </div>
            </div>

            {error && (
              <MessageCard
                type="error"
                title="Something went wrong"
                className="mt-6"
              >
                {error}
              </MessageCard>
            )}

            <button
              onClick={handleCreateInterview}
              disabled={!selectedType || loading}
              className="mt-8 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Generate Interview"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default InterviewPage;
