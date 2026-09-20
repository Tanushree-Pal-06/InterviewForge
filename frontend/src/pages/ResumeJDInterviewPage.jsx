import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analyzeResumeJD, createResumeJDInterview } from "../api/interviewApi";
import Navbar from "../components/Navbar";
import MessageCard from "../components/MessageCard";

function ResumeJDInterviewPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isDark } = useTheme();

  // Multi-step: 1 = Input, 2 = Analysis & Insights, 3 = Interview Setup
  const [step, setStep] = useState(1);

  // Form states
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  // Status states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
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
        ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400";

  const countClass = (active) =>
    active
      ? "border-cyan-400 bg-cyan-400 text-slate-950"
      : isDark
        ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400";

  // Step 1: Analyze Resume and Job Description
  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Analyzing Resume & Job Description with Gemini...");
      setError("");
      setSuccess("");

      const data = await analyzeResumeJD(
        resumeText.trim(),
        jobDescription.trim(),
        token
      );

      setAnalysis(data);
      setSuccess("Analysis complete! Review your skill alignment below.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to analyze resume and job description.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // Step 3 -> 4: Generate Personalized Interview and Navigate
  const handleGenerateInterview = async () => {
    if (!analysis) {
      setError("Analysis data missing. Please re-run the analysis.");
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Generating personalized mock interview questions...");
      setError("");
      setSuccess("");

      const interviewData = {
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim(),
        resumeAnalysis: analysis.resumeAnalysis,
        jdAnalysis: analysis.jdAnalysis,
        matchingSkills: analysis.matchingSkills || [],
        missingSkills: analysis.missingSkills || [],
        preparationInsights: analysis.preparationInsights || {},
        questionCount,
        difficulty,
      };

      const data = await createResumeJDInterview(interviewData, token);

      if (data?.interview?._id) {
        navigate(`/interview/session/${data.interview._id}`);
      } else {
        throw new Error("Interview created but no valid ID returned.");
      }
    } catch (err) {
      setError(err.message || "Failed to generate personalized interview.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleClearDraft = () => {
    setResumeText("");
    setJobDescription("");
    setAnalysis(null);
    setStep(1);
    setError("");
    setSuccess("");
  };

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="p-6">
        <div className="mx-auto max-w-5xl">
          <div className={`rounded-3xl border p-8 ${panelClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                  Feature 3 &bull; Personalized Mock Interview
                </p>
                <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                  Resume + JD Interview
                </h1>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {[
                  { num: 1, label: "Input" },
                  { num: 2, label: "Insights" },
                  { num: 3, label: "Setup" },
                ].map((s) => (
                  <div
                    key={s.num}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                      step === s.num
                        ? "bg-cyan-400 text-slate-950 font-bold"
                        : step > s.num
                          ? isDark
                            ? "bg-slate-800 text-cyan-400"
                            : "bg-slate-200 text-cyan-600"
                          : isDark
                            ? "bg-slate-800/50 text-slate-500"
                            : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <span>{s.num}.</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className={`mt-3 ${mutedTextClass}`}>
              Paste your resume and target job description. AI analyzes skill matches,
              pinpoints gap areas, and crafts realistic interview questions tailored specifically
              to your profile and the role.
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

            {success && (
              <MessageCard type="success" className="mt-4">
                {success}
              </MessageCard>
            )}

            {loading && (
              <div className={`mt-6 rounded-2xl border p-6 text-center ${innerCardClass}`}>
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
                <p className="mt-3 font-semibold text-cyan-400">
                  {loadingMessage || "Processing..."}
                </p>
                <p className={`mt-1 text-xs ${mutedTextClass}`}>
                  This may take a few moments while Gemini analyzes your content.
                </p>
              </div>
            )}

            {/* ================= STEP 1: RESUME & JD INPUT ================= */}
            {step === 1 && !loading && (
              <div className="mt-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={`text-sm font-semibold ${labelTextClass}`}>
                        Resume Content
                      </label>
                      <span className={`text-xs ${mutedTextClass}`}>
                        Plain text / Markdown
                      </span>
                    </div>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={14}
                      placeholder="Paste your plain-text resume here... Include skills, work experience, projects, tools, and education."
                      className={`mt-2 w-full rounded-2xl border p-4 outline-none focus:border-cyan-400 font-mono text-sm ${inputClass}`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className={`text-sm font-semibold ${labelTextClass}`}>
                        Job Description (JD)
                      </label>
                      <span className={`text-xs ${mutedTextClass}`}>
                        Target Role
                      </span>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={14}
                      placeholder="Paste target job description here... Include required skills, responsibilities, qualifications, and domain expectations."
                      className={`mt-2 w-full rounded-2xl border p-4 outline-none focus:border-cyan-400 font-mono text-sm ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={!resumeText.trim() || !jobDescription.trim() || loading}
                    className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Analyze Resume & JD
                  </button>

                  <button
                    onClick={handleClearDraft}
                    className={`rounded-xl border px-6 py-3 font-semibold transition ${
                      isDark
                        ? "border-slate-700 text-slate-300 hover:border-slate-600"
                        : "border-slate-300 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    Clear Draft
                  </button>

                  {analysis && (
                    <button
                      onClick={() => setStep(2)}
                      className="ml-auto rounded-xl border border-cyan-400/50 px-5 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-400/10"
                    >
                      View Previous Analysis &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 2: REVIEW INSIGHTS ================= */}
            {step === 2 && analysis && !loading && (
              <div className="mt-8 space-y-6">
                <div className={`rounded-2xl border p-6 ${innerCardClass}`}>
                  <h2 className="text-2xl font-bold">
                    Resume + JD Analysis Insights
                  </h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    AI evaluated your resume against the target role requirements.
                  </p>

                  {/* Alignment Summary */}
                  {analysis.preparationInsights?.alignmentSummary && (
                    <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Alignment Summary
                      </p>
                      <p className={`mt-1 text-sm leading-relaxed ${labelTextClass}`}>
                        {analysis.preparationInsights.alignmentSummary}
                      </p>
                    </div>
                  )}

                  {/* Matching vs Missing Skills */}
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* Matching Skills */}
                    <div className={`rounded-xl border p-5 ${panelClass}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-emerald-400"></span>
                        <h3 className="font-semibold text-emerald-400">
                          Matching Skills ({analysis.matchingSkills?.length || 0})
                        </h3>
                      </div>
                      <p className={`mt-1 text-xs ${mutedTextClass}`}>
                        Present in both your resume and the JD.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(analysis.matchingSkills || []).length === 0 ? (
                          <p className={`text-xs italic ${mutedTextClass}`}>
                            No direct skill matches detected.
                          </p>
                        ) : (
                          analysis.matchingSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
                            >
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Missing / Gap Skills */}
                    <div className={`rounded-xl border p-5 ${panelClass}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-amber-400"></span>
                        <h3 className="font-semibold text-amber-400">
                          Missing / Gap Skills ({analysis.missingSkills?.length || 0})
                        </h3>
                      </div>
                      <p className={`mt-1 text-xs ${mutedTextClass}`}>
                        Required by JD, but not evident in provided resume.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(analysis.missingSkills || []).length === 0 ? (
                          <p className={`text-xs italic ${mutedTextClass}`}>
                            No critical missing skills detected.
                          </p>
                        ) : (
                          analysis.missingSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400"
                            >
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Areas to Improve */}
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* Strengths */}
                    {analysis.preparationInsights?.strengths?.length > 0 && (
                      <div className={`rounded-xl border p-5 ${panelClass}`}>
                        <h3 className="font-semibold text-cyan-400">
                          Resume Strengths for this Role
                        </h3>
                        <ul className={`mt-3 list-disc space-y-2 pl-5 text-sm ${labelTextClass}`}>
                          {analysis.preparationInsights.strengths.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Areas to Prepare */}
                    {analysis.preparationInsights?.areasToImprove?.length > 0 && (
                      <div className={`rounded-xl border p-5 ${panelClass}`}>
                        <h3 className="font-semibold text-cyan-400">
                          Areas to Prepare & Deepen
                        </h3>
                        <ul className={`mt-3 list-disc space-y-2 pl-5 text-sm ${labelTextClass}`}>
                          {analysis.preparationInsights.areasToImprove.map((area, i) => (
                            <li key={i}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setStep(3)}
                      className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Continue to Interview Setup &rarr;
                    </button>

                    <button
                      onClick={() => setStep(1)}
                      className={`rounded-xl border px-6 py-3 font-semibold transition ${
                        isDark
                          ? "border-slate-700 text-slate-300 hover:border-slate-600"
                          : "border-slate-300 text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      &larr; Edit Resume / JD
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: CONFIGURE & GENERATE ================= */}
            {step === 3 && analysis && !loading && (
              <div className="mt-8 space-y-6">
                <div className={`rounded-2xl border p-6 ${innerCardClass}`}>
                  <h2 className="text-2xl font-bold">
                    Configure Interview Settings
                  </h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    Customize the question count and challenge level for your practice session.
                  </p>

                  {/* Question Count Selection */}
                  <div className="mt-6">
                    <label className={`block text-sm font-semibold ${labelTextClass}`}>
                      Question Count
                    </label>
                    <p className={`mt-1 text-xs ${mutedTextClass}`}>
                      Select how many personalized questions you want generated.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {[
                        { count: 5, label: "5 Questions", desc: "Quick targeted practice" },
                        { count: 10, label: "10 Questions", desc: "Balanced mock interview" },
                        { count: 15, label: "15 Questions", desc: "Comprehensive full round" },
                      ].map((item) => (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => setQuestionCount(item.count)}
                          className={`rounded-xl border p-4 text-left transition ${countClass(
                            questionCount === item.count
                          )}`}
                        >
                          <p className="font-bold">{item.label}</p>
                          <p className="mt-1 text-xs opacity-80">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Difficulty Selection */}
                  <div className="mt-6">
                    <label className={`block text-sm font-semibold ${labelTextClass}`}>
                      Interview Difficulty
                    </label>
                    <p className={`mt-1 text-xs ${mutedTextClass}`}>
                      Choose the rigor of technical and behavioral probing.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          value: "easy",
                          title: "Easy",
                          desc: "Foundational concepts and direct resume experience",
                        },
                        {
                          value: "medium",
                          title: "Medium",
                          desc: "Standard industry interview with scenario questions",
                        },
                        {
                          value: "hard",
                          title: "Hard",
                          desc: "Edge cases, system trade-offs, and in-depth probing",
                        },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setDifficulty(item.value)}
                          className={`rounded-xl border p-4 text-left transition ${difficultyClass(
                            difficulty === item.value
                          )}`}
                        >
                          <p className="font-bold">{item.title}</p>
                          <p className="mt-1 text-xs opacity-80">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generation Summary Box */}
                  <div className={`mt-6 rounded-xl border p-4 ${panelClass}`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      What AI will generate
                    </h4>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedTextClass}`}>
                      A tailored mix of <span className="font-semibold text-cyan-400">{questionCount}</span> questions
                      at <span className="font-semibold text-cyan-400 capitalize">{difficulty}</span> difficulty,
                      spanning resume project deep-dives, JD technical requirements,
                      intersection scenarios on matching skills, and gap area preparedness.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleGenerateInterview}
                      disabled={loading}
                      className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Generate Personalized Interview
                    </button>

                    <button
                      onClick={() => setStep(2)}
                      className={`rounded-xl border px-6 py-3 font-semibold transition ${
                        isDark
                          ? "border-slate-700 text-slate-300 hover:border-slate-600"
                          : "border-slate-300 text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      &larr; Back to Insights
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResumeJDInterviewPage;
