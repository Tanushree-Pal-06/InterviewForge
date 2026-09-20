import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getInterviewAnalytics } from "../api/interviewApi";
import Navbar from "../components/Navbar";
import MessageCard from "../components/MessageCard";

function AnalyticsPage() {
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  const panelClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const cardClass = isDark
    ? "border-slate-800 bg-slate-950"
    : "border-slate-200 bg-slate-50";

  const innerCardClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const pillClass = isDark
    ? "border-slate-700 text-slate-300"
    : "border-slate-300 text-slate-700";

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getInterviewAnalytics(token);
        setAnalytics(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  if (loading) {
    return (
      <div className={pageClass}>
        <Navbar />
        <main className="p-10">Loading analytics...</main>
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
              Analytics
            </p>

            <h1 className="mt-3 text-4xl font-bold">Performance Analytics</h1>

            <p className={`mt-3 ${mutedTextClass}`}>
              Understand your interview performance by topic, score trend, and
              recent activity.
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

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className={`rounded-2xl border p-6 ${cardClass}`}>
                <p className={mutedTextClass}>Total Attempts</p>
                <h2 className="mt-2 text-4xl font-bold">
                  {analytics?.totalAttempts || 0}
                </h2>
              </div>

              <div className={`rounded-2xl border p-6 ${cardClass}`}>
                <p className={mutedTextClass}>Completed Attempts</p>
                <h2 className="mt-2 text-4xl font-bold">
                  {analytics?.completedAttempts || 0}
                </h2>
              </div>
            </div>

            <div className={`mt-8 rounded-2xl border p-6 ${cardClass}`}>
              <h2 className="text-xl font-semibold">Topic-wise Performance</h2>

              <div className="mt-5 space-y-4">
                {analytics?.topicPerformance?.length > 0 ? (
                  analytics.topicPerformance.map((item) => (
                    <div
                      key={item.type}
                      className={`rounded-xl border p-4 ${innerCardClass}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{item.type}</h3>
                          <p className={`mt-1 text-sm ${mutedTextClass}`}>
                            {item.total} completed attempt
                            {item.total > 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm ${mutedTextClass}`}>
                            Avg / Best
                          </p>
                          <p className="text-lg font-bold text-cyan-400">
                            {item.averageScore}% / {item.bestScore}%
                          </p>
                        </div>
                      </div>

                      <div
                        className={`mt-4 h-2 rounded-full ${
                          isDark ? "bg-slate-800" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className="h-2 rounded-full bg-cyan-400"
                          style={{
                            width: `${Math.min(item.averageScore, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={mutedTextClass}>
                    Complete interviews to unlock topic-wise performance.
                  </p>
                )}
              </div>
            </div>

            <div className={`mt-8 rounded-2xl border p-6 ${cardClass}`}>
              <h2 className="text-xl font-semibold">Recent Activity</h2>

              <div className="mt-5 space-y-3">
                {analytics?.recentActivity?.length > 0 ? (
                  analytics.recentActivity.map((item) => (
                    <Link
                      key={item.id}
                      to={`/report/${item.id}`}
                      className={`block rounded-xl border p-4 transition hover:border-cyan-400 ${innerCardClass}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {item.projectName || item.type}
                          </p>
                          <p className={`mt-1 text-sm ${mutedTextClass}`}>
                            {new Date(item.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs capitalize ${pillClass}`}
                          >
                            {item.status}
                          </span>

                          <span className="font-semibold text-cyan-400">
                            {item.status === "completed"
                              ? `${item.score}%`
                              : "--"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className={mutedTextClass}>
                    Your recent interview activity will appear here.
                  </p>
                )}
              </div>
            </div>

            <div className={`mt-8 rounded-2xl border p-6 ${cardClass}`}>
              <h2 className="text-xl font-semibold">Score Trend</h2>

              <div className="mt-5 space-y-3">
                {analytics?.scoreTrend?.length > 0 ? (
                  analytics.scoreTrend.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-xl border p-4 ${innerCardClass}`}
                    >
                      <div>
                        <p className="font-semibold">
                          Attempt {index + 1} · {item.projectName || item.type}
                        </p>
                        <p className={`mt-1 text-sm ${mutedTextClass}`}>
                          {new Date(item.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <span className="text-xl font-bold text-cyan-400">
                        {item.score}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={mutedTextClass}>
                    Score trend will appear after completed interviews.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnalyticsPage;
