import { useState, useRef, useCallback } from "react";

/**
 * Conservative filler words — only words that are almost always fillers
 * in spoken English. Words like "so", "right", "actually" are
 * excluded because they frequently serve legitimate grammatical roles.
 */
const FILLER_WORDS = ["um", "uh", "uhm", "hmm", "erm", "umm", "ahh", "ah", "like"];
const FILLER_PHRASES = ["you know"];

/**
 * Pause detection threshold in milliseconds.
 * A gap > 2 seconds between recognition results is counted as a pause.
 * This is an approximation based on when the speech recognizer delivers results,
 * not a precise audio-level measurement.
 */
const PAUSE_THRESHOLD_MS = 2000;

/**
 * Counts definite filler words and filler phrases in a transcript.
 * Uses word-boundary matching to avoid false positives inside longer words.
 */
function countFillerWords(transcript) {
  if (!transcript || !transcript.trim()) return { total: 0, details: {} };

  const lower = transcript.toLowerCase();
  const details = {};
  let total = 0;

  // Count filler phrases first (multi-word)
  for (const phrase of FILLER_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      details[phrase] = matches.length;
      total += matches.length;
    }
  }

  // Count single filler words with word boundaries
  const words = lower.split(/\s+/);
  for (const filler of FILLER_WORDS) {
    let count = 0;
    for (const word of words) {
      // Strip punctuation for matching
      const cleaned = word.replace(/[^a-z]/g, "");
      if (cleaned === filler) {
        count++;
      }
    }
    if (count > 0) {
      details[filler] = count;
      total += count;
    }
  }

  return { total, details };
}

/**
 * Custom hook for browser-native speech recognition with communication metrics.
 *
 * Metrics that are reliably measurable via the Web Speech API:
 *   - totalDuration: wall-clock time from start to stop (ms)
 *   - wordCount: number of words in the final transcript
 *   - wordsPerMinute: wordCount / (totalDuration in minutes) — approximate,
 *     includes pauses in the denominator
 *   - pauseCount: number of gaps > 2s between recognition result events
 *     (an approximation, not a precise audio measurement)
 *   - fillerWordCount: count of definite filler words (um, uh, hmm, etc.)
 *   - fillerWordDetails: breakdown of which fillers were detected
 *
 * Metrics NOT included because the Web Speech API cannot reliably measure them:
 *   - Actual speaking duration vs silence duration
 *   - Silence-to-speaking ratio
 *   - Audio volume / energy levels
 *   - Precise pause durations
 */
export default function useSpeechRecognition() {
  const [status, setStatus] = useState("idle"); // idle | listening | error | unsupported
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [metrics, setMetrics] = useState(null);

  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastResultTimeRef = useRef(null);
  const pauseCountRef = useRef(0);
  const finalTranscriptRef = useRef("");
  const isStoppingRef = useRef(false);

  /**
   * Check if the Web Speech API is available in this browser.
   */
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  /**
   * Compute communication metrics from the completed recording session.
   */
  const computeMetrics = useCallback((finalText, recordingStartTime) => {
    const totalDuration = Date.now() - recordingStartTime;
    const words = finalText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const totalDurationMinutes = totalDuration / 60000;
    const wordsPerMinute = totalDurationMinutes > 0
      ? Math.round(wordCount / totalDurationMinutes)
      : 0;

    const fillerResult = countFillerWords(finalText);

    return {
      answeredViaVoice: true,
      totalDuration: Math.round(totalDuration),
      wordCount,
      wordsPerMinute,
      pauseCount: pauseCountRef.current,
      fillerWordCount: fillerResult.total,
      fillerWordDetails: fillerResult.details,
    };
  }, []);

  /**
   * Start speech recognition.
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      setStatus("unsupported");
      setErrorMessage("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Reset state
    setErrorMessage("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";
    pauseCountRef.current = 0;
    isStoppingRef.current = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      startTimeRef.current = Date.now();
      lastResultTimeRef.current = Date.now();
      setStatus("listening");
    };

    recognition.onresult = (event) => {
      const now = Date.now();

      // Detect pauses: if the gap since the last result exceeds threshold
      if (lastResultTimeRef.current && (now - lastResultTimeRef.current) > PAUSE_THRESHOLD_MS) {
        pauseCountRef.current += 1;
      }
      lastResultTimeRef.current = now;

      let interim = "";
      let finalPart = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalPart += resultText;
        } else {
          interim += resultText;
        }
      }

      if (finalPart) {
        finalTranscriptRef.current += finalPart;
        setTranscript(finalTranscriptRef.current);
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      // Don't treat "aborted" as an error when we're intentionally stopping
      if (isStoppingRef.current && event.error === "aborted") {
        return;
      }

      let message = "Speech recognition error.";
      switch (event.error) {
        case "not-allowed":
          message = "Microphone permission was denied. Please allow microphone access and try again.";
          break;
        case "no-speech":
          message = "No speech was detected. Please try again.";
          break;
        case "audio-capture":
          message = "No microphone found. Please connect a microphone and try again.";
          break;
        case "network":
          message = "A network error occurred during speech recognition.";
          break;
        case "aborted":
          message = "Speech recognition was aborted.";
          break;
        default:
          message = `Speech recognition error: ${event.error}`;
      }

      setErrorMessage(message);
      setStatus("error");
    };

    recognition.onend = () => {
      // Compute metrics only if we actually recorded something
      if (startTimeRef.current && status !== "error") {
        const finalText = finalTranscriptRef.current;
        const computedMetrics = computeMetrics(finalText, startTimeRef.current);
        setMetrics(computedMetrics);
      }

      if (status !== "error") {
        setStatus("idle");
      }

      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setErrorMessage("Failed to start speech recognition. Please try again.");
      setStatus("error");
    }
  }, [isSupported, computeMetrics, status]);

  /**
   * Stop speech recognition.
   */
  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /**
   * Reset the hook state completely.
   */
  const resetSpeech = useCallback(() => {
    if (recognitionRef.current) {
      isStoppingRef.current = true;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setStatus("idle");
    setTranscript("");
    setInterimTranscript("");
    setErrorMessage("");
    setMetrics(null);
    finalTranscriptRef.current = "";
    pauseCountRef.current = 0;
    startTimeRef.current = null;
    lastResultTimeRef.current = null;
    isStoppingRef.current = false;
  }, []);

  /**
   * Clear just the error state so the user can retry.
   */
  const clearError = useCallback(() => {
    setErrorMessage("");
    setStatus("idle");
  }, []);

  return {
    // State
    status,
    transcript,
    interimTranscript,
    errorMessage,
    metrics,
    isSupported,

    // Actions
    startListening,
    stopListening,
    resetSpeech,
    clearError,
  };
}
