const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const getGeminiModel = () => {
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
};

const getFallbackModel = () => {
  return process.env.GEMINI_FALLBACK_MODEL || "";
};

/**
 * Centralized Gemini API call with automatic fallback.
 * Tries the primary model first. If it fails with 429 or 503 AND
 * a fallback model is configured, retries once with the fallback model.
 * If the fallback also fails (or no fallback is configured), the error
 * is re-thrown so controllers can handle it with user-friendly messages.
 */
const callGemini = async (contents, config = {}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing");
  }

  const primaryModel = getGeminiModel();
  const fallbackModel = getFallbackModel();

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents,
      config: {
        responseMimeType: "application/json",
        ...config,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    return text;
  } catch (primaryError) {
    const status = primaryError.status || primaryError.httpStatusCode;
    const isTemporary = status === 429 || status === 503;

    if (!isTemporary || !fallbackModel) {
      throw primaryError;
    }

    console.warn(
      `Primary Gemini model (${primaryModel}) failed with ${status}. Trying fallback model (${fallbackModel})...`
    );

    try {
      const response = await ai.models.generateContent({
        model: fallbackModel,
        contents,
        config: {
          responseMimeType: "application/json",
          ...config,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini fallback returned empty response");
      }

      return text;
    } catch (fallbackError) {
      // Re-throw the original primary error so controller error handling
      // sees the expected 429/503 status codes for user-friendly messages
      throw primaryError;
    }
  }
};


const generateInterviewQuestions = async ({
  role,
  topic,
  experienceLevel,
  questionCount = 5,
  previousQuestions = [],
}) => {
  // Build bounded previous-history section using both topics and question texts
  let previousHistorySection = "";
  if (previousQuestions.length > 0) {
    const coveredTopics = [...new Set(previousQuestions.map(q => q.topic).filter(Boolean))];
    const questionTexts = previousQuestions.map(q => q.question);

    previousHistorySection = `
PREVIOUSLY PRACTICED — avoid repeating these concepts or questions:

Covered topics/concepts: ${coveredTopics.join(", ")}

Previous questions:
${questionTexts.map((q, i) => `${i + 1}. ${q}`).join("\n")}

IMPORTANT: Generate substantially different questions covering fresh concepts NOT listed above. Do not rephrase or semantically duplicate any previous question. A question that asks the same concept with different wording is still a duplicate.
`;
  }

  const prompt = `
Generate ${questionCount} mock interview questions.

Role: ${role}
Topic: ${topic}
Experience Level: ${experienceLevel}
${previousHistorySection}
QUESTION LANGUAGE RULES:
- Use natural, conversational interview language suitable for intern/entry-level candidates.
- Questions should sound like what a real interviewer would naturally ask.
- Avoid unnecessarily complicated vocabulary, overly academic wording, or long artificial phrasing.
- Do NOT make questions childish or oversimplified. They should remain technically meaningful.
- Example of BAD phrasing: "Elucidate the underlying mechanisms through which..."
- Example of GOOD phrasing: "Can you explain how this works and why you would use it?"

QUESTION FLOW RULES:
- Questions should have a natural conversational flow, like a real interviewer.
- Some questions should be follow-ups that go deeper into the previous question's topic.
- Use natural transitions like "Let's explore this further...", "Going a little deeper...", "Now consider a practical situation...", "Let's move to another area..."
- NEVER reference or assume the candidate's answer. All questions are generated before answers are given.
- Do NOT say "You mentioned...", "Since you said...", or "Based on your answer..."

TOPIC DIVERSITY RULES:
- Cover different sub-topics within ${topic}. Do not ask 3+ questions about the same narrow concept.
- Aim for breadth: each question should explore a different concept or area.
- 2-3 questions may share a broader theme, but should explore different aspects.

DIFFICULTY PROGRESSION:
- Start with medium difficulty and naturally progress toward harder questions.
- The last 1-2 questions should be the most challenging.
- Do not force a rigid pattern; make it feel natural.

QUESTION TYPE VARIETY:
- Include a mix of: conceptual, analytical, practical/implementation, and scenario-based questions.
- Not all questions should be the same style.

EXPECTED POINTS RULES:
- expectedPoints should contain 3-5 concise key points that a strong candidate's answer should cover.
- These are evaluation bullet points, NOT a full model answer or long explanation.
- Keep each point short and specific.

Return JSON only in this exact format:
{
  "questions": [
    {
      "question": "string",
      "type": "technical",
      "difficulty": "medium",
      "topic": "short topic/concept tag, e.g. Binary Search, Graphs, REST APIs",
      "expectedPoints": ["string", "string", "string"]
    }
  ]
}

Allowed type values: technical, behavioral, practical.
Allowed difficulty values: easy, medium, hard.
`;

  const text = await callGemini(prompt);
  return JSON.parse(text);
};

const evaluateAnswer = async ({
  question,
  answer,
  expectedPoints,
}) => {
  const prompt = `
Evaluate this interview answer.

Question:
${question}

Candidate Answer:
${answer}

Expected Points:
${expectedPoints.join(", ")}

Return JSON only:

{
  "score": 0,
  "feedback": "string",
  "weakAreas": ["string"]
}

Rules:
- score must be between 0 and 100
- feedback should be 2-4 lines
- weakAreas should contain missing concepts
`;

  const text = await callGemini(prompt);
  return JSON.parse(text);
};

const evaluateInterviewAnswers = async ({ questions }) => {
  const formattedQuestions = questions.map((item, index) => {
    const base = {
      questionNumber: index + 1,
      questionId: item._id.toString(),
      question: item.question,
      answer: item.answer || "",
      expectedPoints: item.expectedPoints,
    };

    // Include speech metrics only if the answer was given via voice
    if (item.speechMetrics && item.speechMetrics.answeredViaVoice) {
      base.speechMetrics = {
        totalDuration: item.speechMetrics.totalDuration,
        wordCount: item.speechMetrics.wordCount,
        wordsPerMinute: item.speechMetrics.wordsPerMinute,
        pauseCount: item.speechMetrics.pauseCount,
        fillerWordCount: item.speechMetrics.fillerWordCount,
      };
    }

    return base;
  });

  const hasSpeechMetrics = formattedQuestions.some((q) => q.speechMetrics);

  let speechInstructions = "";
  if (hasSpeechMetrics) {
    speechInstructions = `

Some answers were provided via voice input and include speechMetrics.
For those answers, include a "communicationFeedback" field in the result with a short observation about:
- Speaking pace (wordsPerMinute)
- Filler word usage (fillerWordCount)
- Pause frequency (pauseCount)
- A brief constructive communication suggestion

CRITICAL RULES for communicationFeedback:
- ONLY describe the measurable metrics provided. Do NOT interpret them.
- Do NOT infer or claim confidence, nervousness, anxiety, personality traits, intelligence, or emotional states.
- Do NOT say things like "the candidate seems nervous" or "this indicates lack of confidence."
- Use neutral language: "moderate speaking pace", "several filler words detected", "few pauses observed."
- Keep communicationFeedback to 2-3 short sentences maximum.
- If an answer does NOT have speechMetrics, do NOT include communicationFeedback for it.
`;
  }

  const prompt = `
Evaluate this complete mock interview.

Questions and answers:
${JSON.stringify(formattedQuestions, null, 2)}
${speechInstructions}
Return JSON only:

{
  "results": [
    {
      "questionId": "string",
      "score": 0,
      "feedback": "string",
      "coveredPoints": ["string"],
      "missedPoints": ["string"],
      "weakAreas": ["string"],
      "communicationFeedback": "string or omit if no speechMetrics"
    }
  ],
  "overallFeedback": "string",
  "overallWeakAreas": ["string"],
  "strengths": ["string"],
  "preparationSuggestions": ["string"]
}

Rules:
- score must be between 0 and 100
- feedback should be a short, specific explanation of how the answer could be improved
- coveredPoints: which of the expectedPoints the candidate addressed correctly (use concise wording)
- missedPoints: which important expectedPoints the candidate failed to mention or got wrong
- weakAreas should contain missing concepts
- strengths: 3-5 specific things the candidate demonstrated well across the interview (based on actual answers, not generic statements)
- preparationSuggestions: 3-5 actionable, specific study/practice recommendations based on weak areas and missed points (e.g. "Revise BFS and DFS and practice 3-5 graph traversal problems")
`;

  const text = await callGemini(prompt);
  return JSON.parse(text);
};

const analyzeProjectReadme = async ({ readme }) => {
  const prompt = `
Analyze this README and extract project information.

README:
${readme}

Return JSON only:

{
  "projectName": "string",
  "description": "string",
  "techStack": ["string"],
  "features": ["string"],
  "challenges": ["string"]
}

Rules:
- Keep description short
- Extract only from README
- Do not invent fake features
- If something is missing, return an empty array or empty string
`;

  const text = await callGemini(prompt);
  return JSON.parse(text);
};

const generateProjectInterviewQuestions = async ({
  projectName,
  description,
  techStack,
  features,
  challenges,
  difficulty = "medium",
  questionCount = 5,
  previousQuestions = [],
}) => {
  // Build bounded previous-history section using both topics and question texts
  let previousHistorySection = "";
  if (previousQuestions.length > 0) {
    const coveredTopics = [...new Set(previousQuestions.map(q => q.topic).filter(Boolean))];
    const questionTexts = previousQuestions.map(q => q.question);

    previousHistorySection = `
PREVIOUSLY PRACTICED — avoid repeating these aspects or questions:

Covered topics/aspects: ${coveredTopics.join(", ")}

Previous questions:
${questionTexts.map((q, i) => `${i + 1}. ${q}`).join("\n")}

IMPORTANT: Generate substantially different questions covering fresh aspects of this project NOT listed above. Do not rephrase or semantically duplicate any previous question.
`;
  }

  const prompt = `
Generate ${questionCount} realistic project-based interview questions.

Project Name:
${projectName}

Description:
${description}

Tech Stack:
${techStack.join(", ")}

Features:
${features.join(", ")}

Challenges:
${challenges.join(", ")}

Selected Difficulty:
${difficulty}
${previousHistorySection}
QUESTION LANGUAGE RULES:
- Use natural, conversational interview language suitable for intern/entry-level candidates.
- Questions should sound like what a real interviewer would naturally ask about this project.
- Avoid unnecessarily complicated vocabulary, overly academic wording, or long artificial phrasing.
- Do NOT make questions childish or oversimplified. They should remain technically meaningful.
- Example of BAD phrasing: "Elucidate the architectural considerations that informed..."
- Example of GOOD phrasing: "Why did you choose this architecture, and what tradeoffs did you consider?"

QUESTION FLOW RULES:
- Questions should flow naturally like a real interviewer discussing this project.
- Some questions should be follow-ups that dig deeper into the previous question's aspect.
- Use natural transitions between different project areas.
- NEVER reference or assume the candidate's answer. All questions are generated before answers are given.

TOPIC DIVERSITY RULES:
- Cover different aspects of the project: architecture, implementation, debugging, tradeoffs, security, scalability.
- Do not ask 3+ questions about the same narrow aspect.

EXPECTED POINTS RULES:
- expectedPoints should contain 3-5 concise key points that a strong candidate's answer should cover.
- These are evaluation bullet points, NOT a full model answer or long explanation.
- Keep each point short and specific.

Return JSON only:

{
  "questions": [
    {
      "question": "string",
      "type": "technical",
      "difficulty": "${difficulty}",
      "topic": "short topic/concept tag relevant to this question",
      "expectedPoints": ["string", "string", "string"]
    }
  ]
}

Rules:
- Ask like a real interviewer reviewing this project
- Each question must be short, clear, and maximum 2 lines
- Ask one thing per question only
- Prefer practical project questions over broad system design questions
- Focus on implementation, debugging, tradeoffs, security, scalability, and code ownership
- Do not ask generic theory questions
- Do not combine multiple questions into one

Difficulty Rules:
easy:
- beginner level
- basic implementation and explanation questions

medium:
- internship and placement level
- practical debugging and project discussion questions

hard:
- architecture, scalability, security, tradeoffs
- deep technical review questions

Allowed type values: technical, behavioral, practical.
Allowed difficulty values: easy, medium, hard.
`;

  const text = await callGemini(prompt);
  return JSON.parse(text);
};


// ===================== Feature 3: Resume + JD =====================

/**
 * Analyze resume text and job description in a single Gemini call.
 * Returns structured analysis with matching/gap information.
 */
const analyzeResumeAndJD = async ({ resumeText, jobDescription }) => {
  const prompt = `
You are an expert technical recruiter and career advisor. Analyze the following resume and job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Perform the following analysis:

1. Extract from the RESUME (only information actually present, do NOT invent anything):
   - Programming languages, frameworks, libraries, databases, tools, technologies
   - Internships, work experience, relevant responsibilities
   - Project names with technologies used and key features
   - Certifications, relevant achievements

2. Extract from the JOB DESCRIPTION:
   - Required skills and technologies
   - Preferred/nice-to-have skills
   - Key responsibilities and role expectations
   - Important concepts or domain knowledge mentioned

3. MATCHING:
   - Identify skills/technologies that appear in BOTH resume and JD
   - For database-related skills, treat related terms as matching (e.g., MySQL in resume matches SQL in JD)

4. GAPS:
   - Identify JD requirements that are NOT evident in the resume
   - Use careful wording: these are "not evident in the provided resume", NOT "candidate does not know"

5. PREPARATION INSIGHTS:
   - Resume strengths relevant to this role
   - Areas the candidate should prepare for
   - Brief alignment summary (1-2 sentences)

Return JSON only in this exact format:
{
  "resumeAnalysis": {
    "skills": ["string"],
    "experience": ["string"],
    "projects": [
      {
        "name": "string",
        "technologies": ["string"],
        "description": "string"
      }
    ],
    "certifications": ["string"]
  },
  "jdAnalysis": {
    "requiredSkills": ["string"],
    "preferredSkills": ["string"],
    "responsibilities": ["string"],
    "keyConcepts": ["string"]
  },
  "matchingSkills": ["string"],
  "missingSkills": ["string"],
  "preparationInsights": {
    "strengths": ["string"],
    "areasToImprove": ["string"],
    "alignmentSummary": "string"
  }
}

Rules:
- Only extract information actually present in the resume. Do NOT fabricate skills, projects, or experience.
- For missingSkills, only list skills clearly required in the JD but not evident in the resume.
- Keep arrays concise — no more than 15 items per array.
- Keep alignment summary to 1-2 sentences.
`;

  const text = await callGemini(prompt);
  return JSON.parse(text);
};

/**
 * Generate personalized interview questions based on resume + JD analysis.
 * Creates a balanced mix of resume-based, JD-specific, intersection,
 * scenario, and conceptual questions.
 */
const generateResumeJDInterviewQuestions = async ({
  resumeAnalysis,
  jdAnalysis,
  matchingSkills,
  missingSkills,
  questionCount = 5,
  difficulty = "medium",
  previousQuestions = [],
}) => {
  let previousHistorySection = "";
  if (previousQuestions.length > 0) {
    const coveredTopics = [...new Set(previousQuestions.map(q => q.topic).filter(Boolean))];
    const questionTexts = previousQuestions.map(q => q.question);

    previousHistorySection = `
PREVIOUSLY PRACTICED — avoid repeating these concepts or questions:

Covered topics/concepts: ${coveredTopics.join(", ")}

Previous questions:
${questionTexts.map((q, i) => `${i + 1}. ${q}`).join("\n")}

IMPORTANT: Generate substantially different questions NOT listed above. Do not rephrase or semantically duplicate any previous question.
`;
  }

  const prompt = `
Generate ${questionCount} personalized mock interview questions based on the candidate's resume and the target job description.

CANDIDATE'S RESUME INFORMATION:
Skills: ${(resumeAnalysis.skills || []).join(", ")}
Experience: ${(resumeAnalysis.experience || []).join("; ")}
Projects: ${(resumeAnalysis.projects || []).map(p => `${p.name} (${(p.technologies || []).join(", ")}): ${p.description}`).join("; ")}
Certifications: ${(resumeAnalysis.certifications || []).join(", ")}

JOB DESCRIPTION REQUIREMENTS:
Required Skills: ${(jdAnalysis.requiredSkills || []).join(", ")}
Preferred Skills: ${(jdAnalysis.preferredSkills || []).join(", ")}
Responsibilities: ${(jdAnalysis.responsibilities || []).join("; ")}
Key Concepts: ${(jdAnalysis.keyConcepts || []).join(", ")}

MATCHING SKILLS (present in both resume and JD):
${(matchingSkills || []).join(", ")}

SKILLS NOT EVIDENT IN RESUME (required by JD):
${(missingSkills || []).join(", ")}

Selected Difficulty: ${difficulty}
${previousHistorySection}
QUESTION LANGUAGE RULES:
- Use natural, conversational interview language suitable for intern/entry-level candidates.
- Questions should sound like what a real interviewer would naturally ask.
- Avoid unnecessarily complicated vocabulary, overly academic wording, or long artificial phrasing.
- Do NOT make questions childish or oversimplified. They should remain technically meaningful.
- Example of BAD phrasing: "Elucidate the underlying mechanisms through which..."
- Example of GOOD phrasing: "Can you walk me through how you implemented this and why?"

QUESTION GENERATION RULES:

Generate a BALANCED mix of these question categories:

A. RESUME-BASED QUESTIONS (about things actually in the resume):
   - Ask about candidate's listed projects, technologies, responsibilities
   - Example: "You worked on [project]. Explain [specific aspect from resume]."
   - Only reference information ACTUALLY present in the resume

B. JD-SPECIFIC QUESTIONS (based on job requirements):
   - Cover important technologies and concepts from the JD
   - Focus on required skills and key responsibilities

C. RESUME + JD INTERSECTION QUESTIONS (especially important):
   - For matching skills, ask deeper questions connecting the candidate's experience to the role
   - Example: "You used React in your project. How would you handle [JD-relevant scenario] in a production React app?"

D. PRACTICAL / SCENARIO QUESTIONS:
   - Realistic job-related scenarios based on the JD role
   - Example: "Suppose [realistic situation from JD context]. How would you investigate?"

E. CONCEPTUAL / TECHNICAL QUESTIONS:
   - Important concepts from the JD and candidate's background

CRITICAL RULES:
- NEVER assume information not present in the resume
- Do NOT say "Since you said...", "You mentioned in your answer...", or assume answers
- Questions CAN reference resume content like "In your [project name] project..." because that IS provided information
- Each question must be clear, focused, and ask ONE thing
- Maximum 2 lines per question
- Do NOT ask 3+ questions about the same narrow topic
- Start with medium difficulty, naturally progress to harder questions
- The last 1-2 questions should be the most challenging

QUESTION FLOW:
- Questions should flow naturally like a real interviewer
- Use transitions between different areas
- Mix question types throughout — do not cluster all resume questions together

EXPECTED POINTS RULES:
- expectedPoints should contain 3-5 concise key points that a strong candidate's answer should cover.
- These are evaluation bullet points, NOT a full model answer or long explanation.
- Keep each point short and specific.

Return JSON only:
{
  "questions": [
    {
      "question": "string",
      "type": "technical",
      "difficulty": "${difficulty}",
      "topic": "short topic/concept tag",
      "expectedPoints": ["string", "string", "string"]
    }
  ]
}

Allowed type values: technical, behavioral, practical.
Allowed difficulty values: easy, medium, hard.
`;

  const text = await callGemini(prompt);
  return JSON.parse(text);
};


module.exports = {
  generateInterviewQuestions,
  evaluateAnswer,
  evaluateInterviewAnswers,
  analyzeProjectReadme,
  generateProjectInterviewQuestions,
  analyzeResumeAndJD,
  generateResumeJDInterviewQuestions,
};