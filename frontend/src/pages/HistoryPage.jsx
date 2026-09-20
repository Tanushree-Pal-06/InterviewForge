import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getMyInterviews } from "../api/interviewApi";
import Navbar from "../components/Navbar";
import MessageCard from "../components/MessageCard";

function HistoryPage() {
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

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
  const softTextClass = isDark ? "text-slate-500" : "text-slate-500";

  const inputClass = isDark
    ? "border-slate-700 bg-slate-950 text-white"
    : "border-slate-300 bg-white text-slate-950";

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getMyInterviews(token);
        setInterviews(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchHistory();
    }
  }, [token]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesType = typeFilter === "all" || interview.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" || interview.status === statusFilter;

      return matchesType && matchesStatus;
    });
  }, [interviews, typeFilter, statusFilter]);

  const interviewTypes = useMemo(() => {
    return [...new Set(interviews.map((interview) => interview.type))];
  }, [interviews]);

  if (loading) {
    return (
      <div className={pageClass}>
        <Navbar />
        <main className="p-10">Loading history...</main>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="p-6">
        <div className="mx-auto max-w-6xl">
          <div className={`mt-6 rounded-3xl border p-8 ${panelClass}`}>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              History
            </p>

            <h1 className="mt-3 text-4xl font-bold">Interview History</h1>

            <p className={`mt-3 ${mutedTextClass}`}>
              Review previous interview attempts, scores, reports, and project
              interview sessions.
            </p>

            {error && (
              <MessageCard
                type="error"
                title="Something went wrong"
                className="mt-6"
              >
                {error}
              </MessageCard>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Filter by Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400 ${inputClass}`}
                >
                  <option value="all">All types</option>
                  {interviewTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-cyan-400 ${inputClass}`}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {filteredInterviews.length === 0 ? (
                <p
                  className={`rounded-2xl border p-6 ${innerCardClass} ${mutedTextClass}`}
                >
                  No interviews match the selected filters.
                </p>
              ) : (
                filteredInterviews.map((interview) => (
                  <Link
                    key={interview._id}
                    to={`/report/${interview._id}`}
                    className={`block rounded-2xl border p-5 transition hover:border-cyan-400 ${innerCardClass}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950">
                            {interview.type}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                              interview.status === "completed"
                                ? "border-emerald-500/50 text-emerald-400"
                                : "border-yellow-500/50 text-yellow-500"
                            }`}
                          >
                            {interview.status}
                          </span>
                        </div>

                        {interview.type === "Project-Based" &&
                          interview.projectName && (
                            <h2 className="mt-4 text-xl font-semibold">
                              {interview.projectName}
                            </h2>
                          )}

                        {interview.type === "Resume-JD" && (
                          <h2 className="mt-4 text-xl font-semibold">
                            Resume + JD Personalized Interview
                          </h2>
                        )}

                        <p className={`mt-3 text-sm ${mutedTextClass}`}>
                          Created on{" "}
                          {new Date(interview.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>

                        <p className={`mt-2 text-sm ${softTextClass}`}>
                          Questions: {interview.completedQuestions || 0}/
                          {interview.totalQuestions || 0}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`text-sm ${mutedTextClass}`}>Score</p>
                        <p className="mt-1 text-3xl font-bold text-cyan-400">
                          {interview.status === "completed"
                            ? `${interview.score}%`
                            : "--"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HistoryPage;
