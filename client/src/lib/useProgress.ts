import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthUser, Progress } from "../types";
import { ApiError, apiFetch } from "./api";
import { createProgressSaver, type SaveStatus } from "./progressSaver";

const TOKEN_KEY = "lo-trinh-token";
// Give visitors sample progress to explore. These edits stay in memory until they leave;
// signing in loads the account's own progress instead of copying the demo into it.
const guestProgress = (): Progress => ({
  completedTaskIds: ["profile-review", "priority-admission"],
  scores: { thpt: 26.4, hsa: 106, sat: 1380 },
  interests: { universityIds: [], categoryIds: [] }
});

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// Reject incomplete responses before they replace usable local state. Missing
// interests are expected only for accounts saved before that feature existed.
function readSavedProgress(value: unknown): Progress {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid progress");
  const saved = value as Partial<Progress>;
  const scores = saved.scores;
  const interests = saved.interests === undefined
    ? { universityIds: [], categoryIds: [] }
    : saved.interests;
  if (!isStringArray(saved.completedTaskIds)
    || !scores || ![scores.thpt, scores.hsa, scores.sat].every((score) => typeof score === "number" && Number.isFinite(score))
    || !interests || !isStringArray(interests.universityIds) || !isStringArray(interests.categoryIds)) {
    throw new Error("Invalid progress");
  }
  return {
    completedTaskIds: [...saved.completedTaskIds],
    scores: { thpt: scores.thpt, hsa: scores.hsa, sat: scores.sat },
    interests: { universityIds: [...interests.universityIds], categoryIds: [...interests.categoryIds] }
  };
}

// Keep session loading, editable progress, and save feedback together so every view
// uses the same account state and the same rules for when edits can be saved.
export function useProgress() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [progress, setProgress] = useState<Progress>(guestProgress);
  const [sessionLoading, setSessionLoading] = useState(!!localStorage.getItem(TOKEN_KEY));
  const [sessionError, setSessionError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const tokenRef = useRef(localStorage.getItem(TOKEN_KEY));
  const progressRef = useRef(progress);
  // Bump this when the session changes so old requests can't restore the wrong account.
  const generation = useRef(0);
  const saver = useRef<ReturnType<typeof createProgressSaver> | null>(null);

  // Stop the previous save queue before loading an account. Only enable saving again
  // after both the account details and its progress have been loaded and checked.
  const restoreSession = useCallback(async (token: string, signal?: AbortSignal) => {
    const request = ++generation.current;
    saver.current?.dispose();
    saver.current = null;
    setSessionLoading(true);
    setSessionError("");
    setSessionNotice("");
    setSaveStatus("idle");
    try {
      const [account, savedProgress] = await Promise.all([
        apiFetch<AuthUser>("/api/auth/me", { signal }, token),
        apiFetch<unknown>("/api/progress", { signal }, token)
      ]);
      // Ignore this response if a login, logout, or newer restore has overtaken it.
      if (request !== generation.current) return;
      const restored = readSavedProgress(savedProgress);
      if (!account || !Number.isInteger(account.id) || typeof account.name !== "string") throw new Error("Invalid account");
      // Empty tasks, zero scores, and empty interests are valid saved values.
      setUser(account);
      progressRef.current = restored;
      setProgress(restored);
      saver.current = createProgressSaver(
        (snapshot) => apiFetch("/api/progress", {
          method: "PUT", body: JSON.stringify(snapshot)
        }, token),
        setSaveStatus
      );
    } catch (error) {
      if (request !== generation.current || signal?.aborted) return;
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        tokenRef.current = null;
        setUser(null);
        progressRef.current = guestProgress();
        setProgress(progressRef.current);
        setSessionNotice("Phiên đăng nhập đã hết. Đăng nhập lại để xem tiến độ của bạn.");
      } else {
        // A temporary outage must not sign the user out or overwrite saved work.
        setSessionError("Chưa tải được tiến độ của bạn. Thử lại để tiếp tục.");
      }
    } finally {
      if (request === generation.current) setSessionLoading(false);
    }
  }, []);

  // Reopen a saved session on mount. Cleanup stops its requests and save callbacks
  // from updating the screen after this hook has been removed.
  useEffect(() => {
    const controller = new AbortController();
    if (tokenRef.current) void restoreSession(tokenRef.current, controller.signal);
    return () => {
      controller.abort();
      generation.current++;
      saver.current?.dispose();
    };
  }, [restoreSession]);

  // Ask the browser to warn before leaving while edits are still saving or need a retry.
  useEffect(() => {
    if (saveStatus !== "saving" && saveStatus !== "error") return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [saveStatus]);

  function updateProgress(update: (current: Progress) => Progress) {
    if (sessionLoading || sessionError) return;
    // Rapid edits need the latest value, even before React has rendered it.
    const next = update(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    // Signed-in edits enter the save queue; guests have no saver, so their edits stay local.
    // Keep this side effect outside React state updater functions.
    saver.current?.enqueue(next);
  }

  async function login(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    tokenRef.current = token;
    await restoreSession(token);
  }

  async function logout(discardUnsaved = false) {
    // Wait for edits already in flight instead of dropping them on sign-out.
    if (!discardUnsaved && saver.current && !await saver.current.flush()) return;
    generation.current++;
    saver.current?.dispose();
    saver.current = null;
    tokenRef.current = null;
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    progressRef.current = guestProgress();
    setProgress(progressRef.current);
    setSessionError("");
    setSessionNotice("");
    setSessionLoading(false);
    setSaveStatus("idle");
  }

  return {
    user, progress, updateProgress, login, logout,
    sessionLoading, sessionError, sessionNotice, saveStatus,
    retrySession: () => tokenRef.current && restoreSession(tokenRef.current),
    retrySave: () => saver.current?.flush()
  };
}
