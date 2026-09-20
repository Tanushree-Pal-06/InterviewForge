import API_BASE_URL from "./apiClient";

export async function createInterview(type, questionCount, isTimed, token) {
  const response = await fetch(`${API_BASE_URL}/interviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, questionCount, isTimed }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function getMyInterviews(token) {
  const response = await fetch(`${API_BASE_URL}/interviews/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function getInterviewById(id, token) {
  const response = await fetch(`${API_BASE_URL}/interviews/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function saveAnswer(questionId, answer, token, speechMetrics) {
  const body = { answer };
  if (speechMetrics && speechMetrics.answeredViaVoice) {
    body.speechMetrics = speechMetrics;
  }

  const response = await fetch(
    `${API_BASE_URL}/interviews/questions/${questionId}/answer`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}



export async function submitInterview(id, token) {
  const response = await fetch(`${API_BASE_URL}/interviews/${id}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function analyzeReadme(readme, token) {
  const response = await fetch(`${API_BASE_URL}/interviews/analyze-readme`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ readme }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function createProjectInterview(projectData, token) {
  const response = await fetch(`${API_BASE_URL}/interviews/project-interview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function getInterviewAnalytics(token) {
  const response = await fetch(`${API_BASE_URL}/interviews/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function analyzeResumeJD(resumeText, jobDescription, token) {
  const response = await fetch(`${API_BASE_URL}/interviews/analyze-resume-jd`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resumeText, jobDescription }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}

export async function createResumeJDInterview(interviewData, token) {
  const response = await fetch(`${API_BASE_URL}/interviews/resume-jd-interview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(interviewData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}
