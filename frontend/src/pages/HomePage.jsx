import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function HomePage() {
  const { isDark, toggleTheme } = useTheme();

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  const panelClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const innerCardClass = isDark
    ? "bg-slate-800"
    : "bg-slate-100";

  const mutedTextClass = isDark ? "text-slate-300" : "text-slate-600";
  const softTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const questionTextClass = isDark ? "text-slate-200" : "text-slate-700";

  return (
    <div className={pageClass}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <h1 className="text-2xl font-bold">InterviewForge</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">{isDark ? "🌙" : "☀️"}</span>

            <button
              onClick={toggleTheme}
              className={`relative h-6 w-12 rounded-full transition ${
                isDark ? "bg-cyan-400" : "bg-slate-400"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                  isDark ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <Link
            to="/login"
            className={`rounded-xl px-4 py-2 ${
              isDark
                ? "text-slate-300 hover:text-white"
                : "text-slate-700 hover:text-slate-950"
            }`}
          >
            Login
          </Link>

          <Link
            to="/register"
            className={`rounded-xl px-4 py-2 font-semibold ${
              isDark
                ? "bg-white text-slate-950"
                : "bg-slate-950 text-white"
            }`}
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            AI Mock Interview Platform
          </p>

          <h2 className="mb-6 text-5xl font-bold leading-tight">
            Practice interviews like the real placement season.
          </h2>

          <p className={`mb-8 text-lg leading-8 ${mutedTextClass}`}>
            InterviewForge helps students practice technical, HR, and
            project-based interviews, receive AI feedback, track weak areas,
            and improve with personalized preparation plans.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Start Practicing
            </Link>

            <Link
              to="/login"
              className={`rounded-xl border px-6 py-3 font-semibold ${
                isDark
                  ? "border-slate-700 text-white hover:bg-slate-900"
                  : "border-slate-300 text-slate-900 hover:bg-slate-100"
              }`}
            >
              Login
            </Link>
          </div>
        </div>

        <div className={`rounded-3xl border p-6 shadow-2xl ${panelClass}`}>
          <div className={`mb-5 rounded-2xl p-4 ${innerCardClass}`}>
            <p className={`text-sm ${softTextClass}`}>Interview Type</p>
            <h3 className="text-xl font-semibold">Backend Developer Mock</h3>
          </div>

          <div className="space-y-4">
            <div className={`rounded-2xl p-4 ${innerCardClass}`}>
              <p className="text-sm text-cyan-400">Question 1</p>
              <p className={`mt-2 ${questionTextClass}`}>
                Explain how JWT authentication works in a MERN application.
              </p>
            </div>

            <div className={`rounded-2xl p-4 ${innerCardClass}`}>
              <p className="text-sm text-green-400">AI Feedback</p>
              <p className={`mt-2 ${questionTextClass}`}>
                Good explanation. Improve by mentioning token expiry and
                refresh strategy.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className={`rounded-2xl p-4 ${innerCardClass}`}>
                <p className="text-2xl font-bold text-cyan-400">82%</p>
                <p className={`text-xs ${softTextClass}`}>Score</p>
              </div>

              <div className={`rounded-2xl p-4 ${innerCardClass}`}>
                <p className="text-2xl font-bold text-cyan-400">4</p>
                <p className={`text-xs ${softTextClass}`}>Weak Areas</p>
              </div>

              <div className={`rounded-2xl p-4 ${innerCardClass}`}>
                <p className="text-2xl font-bold text-cyan-400">12</p>
                <p className={`text-xs ${softTextClass}`}>Sessions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          "AI-generated interview questions",
          "Detailed feedback and scoring",
          "Weakness tracking and improvement plans",
        ].map((feature) => (
          <div
            key={feature}
            className={`rounded-2xl border p-6 ${panelClass}`}
          >
            <h3 className="text-lg font-semibold">{feature}</h3>
            <p className={`mt-3 text-sm leading-6 ${softTextClass}`}>
              Designed for students preparing for internships, placements, and
              technical interviews.
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default HomePage;