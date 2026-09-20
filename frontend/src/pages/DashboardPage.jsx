import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";

function DashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [summary, setSummary] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    weakAreas: [],
  });

  const [loadingSummary, setLoadingSummary] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  
  const pageClass = isDark
  ? "min-h-screen bg-slate-950 text-white"
  : "min-h-screen bg-slate-50 text-slate-950";

const panelClass = isDark
  ? "border-slate-800 bg-slate-900"
  : "border-slate-200 bg-white";

const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
const softTextClass = isDark ? "text-slate-500" : "text-slate-500";
const tagClass = isDark
  ? "border-slate-700 text-slate-300"
  : "border-slate-300 text-slate-700";

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch(`${API_URL}/interviews/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch summary");
        }

        setSummary(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoadingSummary(false);
      }
    }

    if (token) {
      fetchSummary();
    }
  }, [API_URL, token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className={`rounded-3xl border p-8 ${panelClass}`}>
          <p className="text-sm uppercase tracking-widest text-cyan-400">
            Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Welcome back, {user?.name || "Student"}
          </h1>

          <p className="mt-4 text-slate-400">
            Practice interviews, track performance, and improve weak areas.
          </p>

          <Link
            to="/interview"
            className="mt-6 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Start Interview
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-4">
          <div className={`rounded-2xl border p-6 ${panelClass}`}>
            <p className={mutedTextClass}>Total Interviews</p>
            <h2 className="mt-2 text-3xl font-bold">
              {loadingSummary ? "--" : summary.totalInterviews}
            </h2>
          </div>

          <div className={`rounded-2xl border p-6 ${panelClass}`}>
            <p className={mutedTextClass}>Completed</p>
            <h2 className="mt-2 text-3xl font-bold">
              {loadingSummary ? "--" : summary.completedInterviews}
            </h2>
          </div>

          <div className={`rounded-2xl border p-6 ${panelClass}`}>
            <p className={mutedTextClass}>Average Score</p>
            <h2 className="mt-2 text-3xl font-bold">
              {loadingSummary ? "--" : `${summary.averageScore}%`}
            </h2>
          </div>

          <div className={`rounded-2xl border p-6 ${panelClass}`}>
            <p className={mutedTextClass}>Best Score</p>
            <h2 className="mt-2 text-3xl font-bold">
              {loadingSummary ? "--" : `${summary.bestScore}%`}
            </h2>
          </div>
        </div>

        <div className={`mt-8 rounded-2xl border p-6 ${panelClass}`}>
          <p className={mutedTextClass}>Top Weak Areas</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {loadingSummary ? (
              <span className={softTextClass}>Loading...</span>
            ) : summary.weakAreas.length > 0 ? (
              summary.weakAreas.map((area) => (
                <span
                  key={area}
                  className={`rounded-full border px-4 py-2 text-sm ${tagClass}`}
                >
                  {area}
                </span>
              ))
            ) : (
              <span className={softTextClass}>
                Complete interviews to identify weak areas.
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
