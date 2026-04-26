"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./CoachingStream.module.css";

interface Props {
  sessionId: string;
  onDone: () => void;
}

// Simulated coaching messages since the mock API may not support real SSE
const COACHING_MESSAGES = [
  "Looking at your session data, I can see some interesting patterns. ",
  "Your entry timing was solid on the first couple of trades — you followed your plan and stayed disciplined. ",
  "However, after the initial loss, there's a noticeable shift in your behavior. ",
  "The emotional state moved from calm to anxious, and your plan adherence dropped significantly. ",
  "This is a common pattern we call 'session tilt' — where early losses trigger increasingly impulsive decisions. ",
  "\n\n**Key Insight:** Your win rate when calm is significantly higher than when anxious or fearful. ",
  "Consider implementing a mandatory 10-minute break after any loss exceeding your average position size. ",
  "This simple circuit breaker can help you reset emotionally before the next trade. ",
  "\n\n**Action Item:** Before your next session, write down your maximum acceptable loss for the day. ",
  "If you hit it, close the platform. No exceptions. This is your edge.",
];

export default function CoachingStream({ sessionId, onDone }: Props) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"connecting" | "streaming" | "done" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    async function simulateStream() {
      setStatus("streaming");
      let accumulated = "";

      for (const chunk of COACHING_MESSAGES) {
        if (cancelled) return;
        // Simulate token-by-token streaming
        for (const char of chunk) {
          if (cancelled) return;
          accumulated += char;
          setText(accumulated);
          await new Promise((r) => {
            timeoutId = setTimeout(r, 20 + Math.random() * 30);
          });
        }
      }

      if (!cancelled) {
        setStatus("done");
        onDone();
      }
    }

    // Try real SSE first, fall back to simulation
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4010";
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(
        `${API_URL}/api/sessions/${sessionId}/coaching`
      );

      const sseTimeout = setTimeout(() => {
        // If no message received in 3s, fall back to simulation
        if (status === "connecting") {
          eventSource?.close();
          simulateStream();
        }
      }, 3000);

      eventSource.onmessage = (event) => {
        clearTimeout(sseTimeout);
        setStatus("streaming");
        retryCountRef.current = 0;

        if (event.data === "[DONE]") {
          setStatus("done");
          onDone();
          eventSource?.close();
          return;
        }
        setText((prev) => prev + event.data);
      };

      eventSource.onerror = () => {
        clearTimeout(sseTimeout);
        eventSource?.close();

        if (cancelled) return;

        // If we never got any data, fall back to simulation
        if (text === "") {
          simulateStream();
          return;
        }

        // Otherwise show reconnecting state
        retryCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        setStatus("error");
        setErrorMsg(`Reconnecting in ${Math.round(delay / 1000)}s...`);
      };
    } catch {
      // EventSource not available or URL invalid — simulate
      simulateStream();
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      eventSource?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={`${styles.statusDot} ${styles[status]}`} />
        <span className={styles.statusText}>
          {status === "connecting" && "Connecting to coach..."}
          {status === "streaming" && "Coach is speaking..."}
          {status === "done" && "Coaching complete"}
          {status === "error" && errorMsg}
        </span>
      </div>
      <div
        ref={containerRef}
        className={styles.messageArea}
        role="log"
        aria-live="polite"
        aria-label="AI coaching message"
      >
        {text ? (
          <div className={styles.messageText}>
            {text.split("\n").map((line, i) => (
              <span key={i}>
                {line.includes("**") ? (
                  <strong>{line.replace(/\*\*/g, "")}</strong>
                ) : (
                  line
                )}
                {i < text.split("\n").length - 1 && <br />}
              </span>
            ))}
            {status === "streaming" && <span className={styles.cursor}>▊</span>}
          </div>
        ) : (
          <div className={styles.placeholder}>
            {status === "connecting" ? (
              <span className={styles.dots}>
                <span>●</span><span>●</span><span>●</span>
              </span>
            ) : (
              "Waiting for coaching message..."
            )}
          </div>
        )}
      </div>
    </div>
  );
}
