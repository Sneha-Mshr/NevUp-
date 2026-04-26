import type {
  SessionSummary,
  BehavioralMetrics,
  BehavioralProfile,
  DebriefInput,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4010";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public traceId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithAuth<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        body.message || `API error: ${res.status} ${res.statusText}`,
        body.traceId
      );
    }

    return res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError(408, "Request timed out");
    }
    throw new ApiError(0, (err as Error).message || "Network error");
  } finally {
    clearTimeout(timeout);
  }
}

// GET /sessions/{sessionId}
export async function getSession(sessionId: string, token: string) {
  return fetchWithAuth<SessionSummary>(`/sessions/${sessionId}`, token);
}

// GET /users/{userId}/metrics?from=&to=&granularity=
export async function getUserMetrics(
  userId: string,
  token: string,
  params: { from: string; to: string; granularity: "hourly" | "daily" | "rolling30d" }
) {
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    granularity: params.granularity,
  });
  return fetchWithAuth<BehavioralMetrics>(
    `/users/${userId}/metrics?${qs}`,
    token
  );
}

// GET /users/{userId}/profile
export async function getUserProfile(userId: string, token: string) {
  return fetchWithAuth<BehavioralProfile>(`/users/${userId}/profile`, token);
}

// POST /sessions/{sessionId}/debrief
export async function submitDebrief(
  sessionId: string,
  token: string,
  payload: DebriefInput
) {
  return fetchWithAuth<{ debriefId: string; sessionId: string; savedAt: string }>(
    `/sessions/${sessionId}/debrief`,
    token,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

// SSE /sessions/{sessionId}/coaching
// Event format per spec:
//   event: token
//   data: {"token": "You", "index": 0}
//   event: done
//   data: {"fullMessage": "..."}
export function createCoachingStream(
  sessionId: string,
  token: string,
  onToken: (text: string) => void,
  onError: (err: Error) => void,
  onDone: (fullMessage: string) => void
): () => void {
  let retryCount = 0;
  let eventSource: EventSource | null = null;
  let cancelled = false;

  function connect() {
    if (cancelled) return;

    const url = `${API_URL}/sessions/${sessionId}/coaching?token=${encodeURIComponent(token)}`;
    eventSource = new EventSource(url);

    eventSource.addEventListener("token", (event: MessageEvent) => {
      retryCount = 0;
      try {
        const data = JSON.parse(event.data);
        onToken(data.token);
      } catch {
        onToken(event.data);
      }
    });

    eventSource.addEventListener("done", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onDone(data.fullMessage || "");
      } catch {
        onDone("");
      }
      eventSource?.close();
    });

    eventSource.onerror = () => {
      eventSource?.close();
      if (cancelled) return;

      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      onError(new Error(`Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`));
      setTimeout(connect, delay);
    };
  }

  connect();

  return () => {
    cancelled = true;
    eventSource?.close();
  };
}

export { ApiError };
