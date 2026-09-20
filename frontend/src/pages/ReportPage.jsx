import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getInterviewById } from "../api/interviewApi";
import Navbar from "../components/Navbar";
import MessageCard from "../components/MessageCard";

function ReportPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { isDark } = useTheme();

  const [error, setError] = useState("");
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  const panelClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const cardClass = isDark
    ? "border-slate-800 bg-slate-950"
    : "border-slate-200 bg-slate-50";

  const softCardClass = isDark ? "bg-slate-900" : "bg-white";

  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const bodyTextClass = isDark ? "text-slate-300" : "text-slate-700";

  const pillClass = isDark
    ? "bg-slate-800 text-slate-300"
    : "bg-slate-200 text-slate-700";

  useEffect(() => {
    async function fetchInterview() {
      try {
        const data = await getInterviewById(id, token);
        setInterview(data.interview);
        setQuestions(data.questions || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInterview();
  }, [id, token]);

  // Compute topic-wise performance from questions
  const topicPerformance = (() => {
    const topicMap = {};
    questions.forEach((q) => {
      const topic = q.topic || "";
      if (!topic) return;
      if (!topicMap[topic]) {
        topicMap[topic] = { totalScore: 0, count: 0 };
      }
      topicMap[topic].totalScore += q.score || 0;
      topicMap[topic].count += 1;
    });

    return Object.entries(topicMap)
      .map(([topic, data]) => {
        const avg = Math.round(data.totalScore / data.count);
        let label = "Weak";
        if (avg >= 80) label = "Strong";
        else if (avg >= 60) label = "Good";
        else if (avg >= 40) label = "Needs Improvement";
        return { topic, avg, label, count: data.count };
      })
      .sort((a, b) => b.avg - a.avg);
  })();

  const getPerformanceColor = (label) => {
    switch (label) {
      case "Strong":
        return isDark ? "text-emerald-400" : "text-emerald-600";
      case "Good":
        return isDark ? "text-cyan-400" : "text-cyan-600";
      case "Needs Improvement":
        return isDark ? "text-amber-400" : "text-amber-600";
      case "Weak":
        return isDark ? "text-red-400" : "text-red-600";
      default:
        return mutedTextClass;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return isDark ? "text-emerald-400" : "text-emerald-600";
    if (score >= 60) return isDark ? "text-cyan-400" : "text-cyan-600";
    if (score >= 40) return isDark ? "text-amber-400" : "text-amber-600";
    return isDark ? "text-red-400" : "text-red-600";
  };

  if (loading) {
    return (
      <div className={pageClass}>
        <Navbar />
        <main className="p-10">Loading report...</main>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <Navbar />

      <main className="p-6">
        <div className="mx-auto max-w-5xl">
          <div className={`mt-6 rounded-3xl border p-8 ${panelClass}`}>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              Interview Report
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              {interview?.type === "Project-Based"
                ? `${interview?.projectName} Project Interview`
                : interview?.type === "Resume-JD"
                ? "Resume + JD Personalized Interview"
                : `${interview?.type} Interview`}
            </h1>

            {error && (
              <MessageCard
                type="error"
                title="Something went wrong"
                className="mt-6"
              >
                {error}
              </MessageCard>
            )}

            {/* ===== Summary Cards ===== */}
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                ["Status", interview?.status],
                ["Overall Score", `${interview?.score || 0}%`],
                ["Questions", questions.length],
                [
                  "Answered",
                  `${interview?.completedQuestions || 0}/${questions.length}`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-5 ${cardClass}`}
                >
                  <p className={mutedTextClass}>{label}</p>
                  <h2 className="mt-2 text-2xl font-bold capitalize">
                    {value}
                  </h2>
                </div>
              ))}
            </div>

            {/* ===== Project Overview (existing) ===== */}
            {interview?.type === "Project-Based" && (
              <div className={`mt-8 rounded-2xl border p-5 ${cardClass}`}>
                <h2 className="text-xl font-bold">Project Overview</h2>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-cyan-400">
                    Description
                  </p>
                  <p className={`mt-2 ${bodyTextClass}`}>
                    {interview?.projectDescription}
                  </p>
                </div>

                {interview?.projectTechStack?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-cyan-400">
                      Tech Stack
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {interview.projectTechStack.map((tech, index) => (
                        <span
                          key={index}
                          className={`rounded-full px-3 py-1 text-sm ${pillClass}`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interview?.projectFeatures?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-cyan-400">
                      Key Features
                    </p>

                    <ul
                      className={`mt-3 list-disc space-y-2 pl-5 ${bodyTextClass}`}
                    >
                      {interview.projectFeatures
                        .slice(0, 8)
                        .map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {interview?.projectChallenges?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-cyan-400">
                      Challenges
                    </p>

                    <ul
                      className={`mt-3 list-disc space-y-2 pl-5 ${bodyTextClass}`}
                    >
                      {interview.projectChallenges.map((challenge, index) => (
                        <li key={index}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ===== Resume + JD Analysis (existing) ===== */}
            {interview?.type === "Resume-JD" && (
              <div className={`mt-8 rounded-2xl border p-5 ${cardClass}`}>
                <h2 className="text-xl font-bold">Resume + JD Analysis Insights</h2>

                {interview?.preparationInsights?.alignmentSummary && (
                  <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Alignment Summary
                    </p>
                    <p className={`mt-1 text-sm leading-relaxed ${bodyTextClass}`}>
                      {interview.preparationInsights.alignmentSummary}
                    </p>
                  </div>
                )}

                {interview?.matchingSkills?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-emerald-400">
                      Matching Skills ({interview.matchingSkills.length})
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {interview.matchingSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interview?.missingSkills?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-amber-400">
                      Missing / Gap Skills (Required by JD, not evident in resume) ({interview.missingSkills.length})
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {interview.missingSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interview?.preparationInsights?.strengths?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-cyan-400">
                      Resume Strengths for this Role
                    </p>
                    <ul className={`mt-2 list-disc space-y-1 pl-5 ${bodyTextClass}`}>
                      {interview.preparationInsights.strengths.map((str, index) => (
                        <li key={index}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {interview?.preparationInsights?.areasToImprove?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-cyan-400">
                      Areas to Prepare & Deepen
                    </p>
                    <ul className={`mt-2 list-disc space-y-1 pl-5 ${bodyTextClass}`}>
                      {interview.preparationInsights.areasToImprove.map((area, index) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ===== Overall Feedback ===== */}
            {interview?.feedback && (
              <div className={`mt-8 rounded-2xl border p-5 ${cardClass}`}>
                <h2 className="text-xl font-bold">Overall Feedback</h2>
                <p className={`mt-3 ${bodyTextClass}`}>{interview.feedback}</p>
              </div>
            )}

            {/* ===== Strengths & Weak Areas ===== */}
            {(interview?.strengths?.length > 0 || interview?.weakAreas?.length > 0) && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {interview?.strengths?.length > 0 && (
                  <div className={`rounded-2xl border p-5 ${cardClass}`}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-sm">✓</span>
                      Strengths
                    </h2>
                    <ul className={`mt-4 space-y-2 ${bodyTextClass}`}>
                      {interview.strengths.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {interview?.weakAreas?.length > 0 && (
                  <div className={`rounded-2xl border p-5 ${cardClass}`}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-sm">!</span>
                      Weak Areas
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {interview.weakAreas.slice(0, 8).map((area, index) => (
                        <span
                          key={index}
                          className={`rounded-full px-4 py-2 text-sm ${pillClass}`}
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== Topic-Wise Performance ===== */}
            {topicPerformance.length > 0 && (
              <div className={`mt-6 rounded-2xl border p-5 ${cardClass}`}>
                <h2 className="text-xl font-bold">Topic-Wise Performance</h2>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                        <th className={`pb-3 text-left font-semibold ${mutedTextClass}`}>Topic</th>
                        <th className={`pb-3 text-center font-semibold ${mutedTextClass}`}>Questions</th>
                        <th className={`pb-3 text-center font-semibold ${mutedTextClass}`}>Avg Score</th>
                        <th className={`pb-3 text-right font-semibold ${mutedTextClass}`}>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topicPerformance.map((tp) => (
                        <tr
                          key={tp.topic}
                          className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}
                        >
                          <td className="py-3 font-medium">{tp.topic}</td>
                          <td className={`py-3 text-center ${mutedTextClass}`}>{tp.count}</td>
                          <td className={`py-3 text-center font-semibold ${getScoreColor(tp.avg)}`}>
                            {tp.avg}%
                          </td>
                          <td className={`py-3 text-right font-semibold ${getPerformanceColor(tp.label)}`}>
                            {tp.label}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== Preparation Suggestions ===== */}
            {interview?.preparationSuggestions?.length > 0 && (
              <div className={`mt-6 rounded-2xl border p-5 ${cardClass}`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 text-sm">→</span>
                  Preparation Suggestions
                </h2>
                <ul className={`mt-4 space-y-3 ${bodyTextClass}`}>
                  {interview.preparationSuggestions.map((suggestion, index) => (
                    <li key={index} className={`rounded-xl p-3 ${softCardClass}`}>
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-400">
                        {index + 1}
                      </span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ===== Question-by-Question Review ===== */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold">Question-by-Question Review</h2>

              {questions.length === 0 ? (
                <p className={`mt-4 ${mutedTextClass}`}>No questions found.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {questions.map((item, index) => (
                    <div
                      key={item._id}
                      className={`rounded-2xl border p-5 ${cardClass}`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950">
                          Q{index + 1}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs ${pillClass}`}
                        >
                          {item.type}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs ${pillClass}`}
                        >
                          {item.difficulty}
                        </span>

                        {item.topic && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${pillClass}`}
                          >
                            {item.topic}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            (item.score || 0) >= 60
                              ? "bg-emerald-500/15 text-emerald-400"
                              : (item.score || 0) >= 40
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          Score: {item.score || 0}%
                        </span>
                      </div>

                      <p className="mt-4 text-lg font-semibold">
                        {item.question}
                      </p>

                      {/* Your Answer */}
                      {item.answer && (
                        <div className={`mt-4 rounded-xl p-4 ${softCardClass}`}>
                          <p
                            className={`text-sm font-semibold ${mutedTextClass}`}
                          >
                            Your Answer
                            {item.speechMetrics?.answeredViaVoice && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                Voice
                              </span>
                            )}
                          </p>
                          <p className={`mt-2 ${bodyTextClass}`}>
                            {item.answer}
                          </p>
                        </div>
                      )}

                      {/* Expected Key Points */}
                      {item.expectedPoints?.length > 0 && (
                        <div className={`mt-4 rounded-xl border p-4 ${panelClass}`}>
                          <p className="text-sm font-semibold text-cyan-400">
                            Expected Key Points
                          </p>
                          <ul className={`mt-2 space-y-1 ${bodyTextClass}`}>
                            {item.expectedPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400/60" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Covered & Missed Points */}
                      {(item.coveredPoints?.length > 0 || item.missedPoints?.length > 0) && (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {item.coveredPoints?.length > 0 && (
                            <div className={`rounded-xl p-4 ${isDark ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
                              <p className="text-sm font-semibold text-emerald-400">
                                ✓ You Covered
                              </p>
                              <ul className={`mt-2 space-y-1 ${bodyTextClass}`}>
                                {item.coveredPoints.map((point, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.missedPoints?.length > 0 && (
                            <div className={`rounded-xl p-4 ${isDark ? "bg-red-500/5 border border-red-500/20" : "bg-red-50 border border-red-200"}`}>
                              <p className={`text-sm font-semibold ${isDark ? "text-red-400" : "text-red-500"}`}>
                                ✗ Missed
                              </p>
                              <ul className={`mt-2 space-y-1 ${bodyTextClass}`}>
                                {item.missedPoints.map((point, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isDark ? "bg-red-400" : "bg-red-500"}`} />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Feedback */}
                      {item.feedback && (
                        <div
                          className={`mt-4 rounded-xl border p-4 ${panelClass}`}
                        >
                          <p className="text-sm font-semibold text-cyan-400">
                            Feedback
                          </p>
                          <p className={`mt-2 ${bodyTextClass}`}>
                            {item.feedback}
                          </p>
                        </div>
                      )}

                      {/* Communication Analysis (existing Feature 1) */}
                      {item.speechMetrics?.answeredViaVoice && (
                        <div
                          className={`mt-4 rounded-xl border p-4 ${
                            isDark
                              ? "border-slate-700 bg-slate-800/50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <p className="text-sm font-semibold text-cyan-400">
                            Communication Analysis
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className={mutedTextClass}>Duration: </span>
                              <span className="font-medium">
                                {item.speechMetrics.totalDuration
                                  ? `${Math.round(item.speechMetrics.totalDuration / 1000)}s`
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className={mutedTextClass}>Words: </span>
                              <span className="font-medium">
                                {item.speechMetrics.wordCount || 0}
                              </span>
                            </div>
                            <div>
                              <span className={mutedTextClass}>~WPM: </span>
                              <span className="font-medium">
                                {item.speechMetrics.wordsPerMinute || 0}
                              </span>
                            </div>
                            <div>
                              <span className={mutedTextClass}>Pauses: </span>
                              <span className="font-medium">
                                {item.speechMetrics.pauseCount || 0}
                              </span>
                            </div>
                            <div>
                              <span className={mutedTextClass}>Filler words: </span>
                              <span className="font-medium">
                                {item.speechMetrics.fillerWordCount || 0}
                              </span>
                            </div>
                          </div>

                          {item.communicationFeedback && (
                            <p className={`mt-3 text-sm ${bodyTextClass}`}>
                              {item.communicationFeedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportPage;
