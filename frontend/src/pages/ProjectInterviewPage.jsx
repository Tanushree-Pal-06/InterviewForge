import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analyzeReadme, createProjectInterview } from "../api/interviewApi";
import Navbar from "../components/Navbar";
import MessageCard from "../components/MessageCard";

function ProjectInterviewPage() {
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [readme, setReadme] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [features, setFeatures] = useState("");
  const [challenges, setChallenges] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  const panelClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const innerCardClass = isDark
    ? "border-slate-800 bg-slate-950"
    : "border-slate-200 bg-slate-50";

  const inputClass = isDark
    ? "border-slate-800 bg-slate-900 text-white"
    : "border-slate-300 bg-white text-slate-950";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const labelTextClass = isDark ? "text-slate-300" : "text-slate-700";

  const difficultyClass = (active) =>
    active
      ? "border-cyan-400 bg-cyan-400 text-slate-950"
      : isDark
        ? "border-slate-800 bg-slate-900 text-slate-300"
        : "border-slate-300 bg-white text-slate-700";

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await analyzeReadme(readme, token);

      setAnalysis(data);
      setProjectName(data.projectName || "");
      setDescription(data.description || "");
      setTechStack((data.techStack || []).join(", "));
      setFeatures((data.features || []).join("\n"));
      setChallenges((data.challenges || []).join("\n"));

      setSuccess(
        "README analyzed successfully. Review and edit the extracted fields before generating the interview.",
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInterview = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const projectData = {
        projectName,
        description,
        difficulty,
        techStack: techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        features: features
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        challenges: challenges
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const data = await createProjectInterview(projectData, token);

      window.location.href = `/interview/session/${data.interview._id}`;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearDraft = () => {
    setReadme("");
    setAnalysis(null);
    setProjectName("");
    setDescription("");
    setTechStack("");
    setFeatures("");
    setChallenges("");
    setDifficulty("");
    setError("");
    setSuccess("");
  };

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className={`rounded-3xl border p-8 ${panelClass}`}>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              Project Based Interview
            </p>

            <h1 className="mt-3 text-4xl font-bold">Upload Project README</h1>

            <p className={`mt-3 ${mutedTextClass}`}>
              Paste your README content and AI will understand your project
              before generating interview questions.
            </p>

            <textarea
              value={readme}
              onChange={(e) => setReadme(e.target.value)}
              rows={18}
              placeholder="Paste README.md content here..."
              className={`mt-6 w-full rounded-2xl border p-4 outline-none focus:border-cyan-400 ${inputClass}`}
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!readme || loading}
                className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze README"}
              </button>

              <button
                onClick={handleClearDraft}
                className={`rounded-xl border px-6 py-3 font-semibold ${
                  isDark
                    ? "border-slate-700 text-slate-300"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                Clear Draft
              </button>
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

            {success && (
              <MessageCard type="success" className="mt-4">
                {success}
              </MessageCard>
            )}

            {analysis && (
              <div className={`mt-8 rounded-2xl border p-6 ${innerCardClass}`}>
                <h2 className="text-2xl font-bold">
                  Review Extracted Information
                </h2>

                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  Edit anything if needed before generating your project
                  interview.
                </p>

                {[
                  ["Project Name", projectName, setProjectName, "input"],
                  ["Tech Stack", techStack, setTechStack, "input"],
                ].map(([label, value, setter]) => (
                  <div key={label}>
                    <label
                      className={`mt-5 block text-sm font-semibold ${labelTextClass}`}
                    >
                      {label}
                    </label>
                    <input
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className={`mt-2 w-full rounded-xl border p-3 outline-none focus:border-cyan-400 ${inputClass}`}
                    />
                  </div>
                ))}

                <label
                  className={`mt-5 block text-sm font-semibold ${labelTextClass}`}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`mt-2 w-full rounded-xl border p-3 outline-none focus:border-cyan-400 ${inputClass}`}
                />

                <label
                  className={`mt-5 block text-sm font-semibold ${labelTextClass}`}
                >
                  Features
                </label>
                <textarea
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  rows={6}
                  className={`mt-2 w-full rounded-xl border p-3 outline-none focus:border-cyan-400 ${inputClass}`}
                />

                <label
                  className={`mt-5 block text-sm font-semibold ${labelTextClass}`}
                >
                  Challenges
                </label>
                <textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  rows={4}
                  className={`mt-2 w-full rounded-xl border p-3 outline-none focus:border-cyan-400 ${inputClass}`}
                />

                <div className="mt-5">
                  <p className={`text-sm font-semibold ${labelTextClass}`}>
                    Question Difficulty
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {[
                      {
                        value: "easy",
                        title: "Easy",
                        text: "Basic project explanation",
                      },
                      {
                        value: "medium",
                        title: "Medium",
                        text: "Recommended for internships and placements",
                      },
                      {
                        value: "hard",
                        title: "Hard",
                        text: "Deep architecture and scaling",
                      },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setDifficulty(item.value)}
                        className={`rounded-xl border p-4 text-left ${difficultyClass(
                          difficulty === item.value,
                        )}`}
                      >
                        <p className="font-bold">{item.title}</p>
                        <p className="mt-1 text-sm opacity-80">{item.text}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateInterview}
                  disabled={loading || !difficulty}
                  className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Project Interview"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectInterviewPage;
