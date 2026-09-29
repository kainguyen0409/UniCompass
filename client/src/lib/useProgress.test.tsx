import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser, Progress } from "../types";
import { ApiError, apiFetch } from "./api";
import { useProgress } from "./useProgress";

vi.mock("./api", async (importOriginal) => ({
  ...await importOriginal<typeof import("./api")>(),
  apiFetch: vi.fn()
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const account: AuthUser = { id: 1, name: "Minh", grade: null };
const emptyProgress: Progress = {
  completedTaskIds: [],
  scores: { thpt: 0, hsa: 0, sat: 0 },
  interests: { universityIds: [], categoryIds: [] }
};
const tokenKey = "lo-trinh-token";
const api = vi.mocked(apiFetch);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

describe("account progress", () => {
  let root: Root;
  let host: HTMLDivElement;
  let current: ReturnType<typeof useProgress>;

  function Probe() {
    current = useProgress();
    return null;
  }

  beforeEach(() => {
    api.mockReset();
    localStorage.clear();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    localStorage.clear();
  });

  async function mountSavedAccount(savedProgress = emptyProgress) {
    localStorage.setItem(tokenKey, "saved-token");
    api.mockResolvedValueOnce(account).mockResolvedValueOnce(savedProgress);
    await act(async () => root.render(<Probe />));
  }

  const writes = () => api.mock.calls.filter(([, options]) => options?.method === "PUT");

  it("restores an empty checklist and zero scores immediately after login", async () => {
    act(() => root.render(<Probe />));
    const guestProgress = current.progress;
    expect(guestProgress).not.toEqual(emptyProgress);
    api.mockResolvedValueOnce(account).mockResolvedValueOnce(emptyProgress);

    await act(async () => current.login("new-token"));

    expect(current.user).toEqual(account);
    expect(current.progress).toEqual(emptyProgress);
    expect(current.sessionLoading).toBe(false);
    expect(localStorage.getItem(tokenKey)).toBe("new-token");
    expect(writes()).toHaveLength(0);
    expect(api).toHaveBeenCalledWith("/api/progress", { signal: undefined }, "new-token");
  });

  it("loads account interests instead of saving guest choices over them", async () => {
    act(() => root.render(<Probe />));
    expect(current.progress.interests).toEqual({ universityIds: [], categoryIds: [] });
    act(() => current.updateProgress((progress) => ({
      ...progress, interests: { universityIds: ["ftu"], categoryIds: ["finance"] }
    })));
    expect(writes()).toHaveLength(0);

    const savedProgress: Progress = {
      ...emptyProgress,
      completedTaskIds: ["profile-review"],
      interests: { universityIds: ["hust", "uet"], categoryIds: ["computing"] }
    };
    api.mockResolvedValueOnce(account).mockResolvedValueOnce(savedProgress);
    await act(async () => current.login("account-token"));
    expect(current.progress).toEqual(savedProgress);
    expect(writes()).toHaveLength(0);

    api.mockResolvedValueOnce({ ok: true });
    await act(async () => current.updateProgress((progress) => ({
      ...progress, interests: { universityIds: ["neu", "ftu"], categoryIds: ["business", "finance"] }
    })));
    expect(JSON.parse(writes()[0][1]!.body as string)).toEqual({
      ...savedProgress, interests: { universityIds: ["neu", "ftu"], categoryIds: ["business", "finance"] }
    });
    expect(writes()[0][2]).toBe("account-token");
    expect(current.saveStatus).toBe("saved");
  });

  it("defaults a legacy account without interests to all schools and groups", async () => {
    localStorage.setItem(tokenKey, "saved-token");
    api.mockResolvedValueOnce(account).mockResolvedValueOnce({
      completedTaskIds: [], scores: { thpt: 0, hsa: 0, sat: 0 }
    });
    await act(async () => root.render(<Probe />));
    expect(current.progress).toEqual(emptyProgress);
    expect(writes()).toHaveLength(0);
  });

  it.each([
    ["missing response", null],
    ["missing task list", { scores: emptyProgress.scores }],
    ["task IDs as text", { ...emptyProgress, completedTaskIds: "profile-review" }],
    ["non-string task ID", { ...emptyProgress, completedTaskIds: [7] }],
    ["missing scores", { ...emptyProgress, scores: {} }],
    ["score as text", { ...emptyProgress, scores: { ...emptyProgress.scores, thpt: "27.34" } }],
    ["non-finite score", { ...emptyProgress, scores: { ...emptyProgress.scores, thpt: Infinity } }],
    ["interests as text", { ...emptyProgress, interests: { universityIds: "neu", categoryIds: [] } }],
    ["incomplete interests", { ...emptyProgress, interests: { universityIds: ["neu"] } }]
  ])("keeps saved state and offers retry for malformed progress: %s", async (_label, malformed) => {
    const savedProgress: Progress = {
      ...emptyProgress, interests: { universityIds: ["ftu"], categoryIds: ["finance"] }
    };
    await mountSavedAccount(savedProgress);
    api.mockResolvedValueOnce(account).mockResolvedValueOnce(malformed);
    await act(async () => { await current.retrySession(); });

    expect(current.progress).toEqual(savedProgress);
    expect(current.user).toEqual(account);
    expect(current.sessionLoading).toBe(false);
    expect(current.sessionError).not.toBe("");
    expect(localStorage.getItem(tokenKey)).toBe("saved-token");
    const edit = vi.fn((progress: Progress) => progress);
    act(() => current.updateProgress(edit));
    expect(edit).not.toHaveBeenCalled();
    expect(writes()).toHaveLength(0);

    api.mockResolvedValueOnce(account).mockResolvedValueOnce(emptyProgress);
    await act(async () => { await current.retrySession(); });
    expect(current.sessionError).toBe("");
    expect(current.progress).toEqual(emptyProgress);
  });

  it("rejects a malformed account before exposing it to the page", async () => {
    localStorage.setItem(tokenKey, "saved-token");
    api.mockResolvedValueOnce({}).mockResolvedValueOnce(emptyProgress);
    await act(async () => root.render(<Probe />));
    expect(current.user).toBeNull();
    expect(current.sessionError).not.toBe("");
    expect(writes()).toHaveLength(0);
  });

  it("ignores an older account restore that completes after switching accounts", async () => {
    act(() => root.render(<Probe />));
    const oldAccount = deferred<AuthUser>();
    const oldProgress = deferred<Progress>();
    api.mockReturnValueOnce(oldAccount.promise).mockReturnValueOnce(oldProgress.promise);
    let firstLogin!: Promise<void>;
    act(() => { firstLogin = current.login("first-token"); });

    const nextAccount = { id: 2, name: "An", grade: null };
    const nextProgress = { ...emptyProgress, interests: { universityIds: ["ftu"], categoryIds: ["languages"] } };
    api.mockResolvedValueOnce(nextAccount).mockResolvedValueOnce(nextProgress);
    await act(async () => current.login("second-token"));
    await act(async () => {
      oldAccount.resolve(account);
      oldProgress.resolve({ ...emptyProgress, interests: { universityIds: ["hust"], categoryIds: ["engineering"] } });
      await firstLogin;
    });

    expect(current.user).toEqual(nextAccount);
    expect(current.progress).toEqual(nextProgress);
    expect(localStorage.getItem(tokenKey)).toBe("second-token");
    expect(writes()).toHaveLength(0);
  });

  it("never carries queued interests or a late save status into another account", async () => {
    await mountSavedAccount();
    const oldSave = deferred<{ ok: boolean }>();
    api.mockReturnValueOnce(oldSave.promise);
    act(() => current.updateProgress((progress) => ({
      ...progress, interests: { universityIds: ["hust"], categoryIds: ["computing"] }
    })));
    act(() => current.updateProgress((progress) => ({
      ...progress, interests: { universityIds: ["uet"], categoryIds: ["engineering"] }
    })));

    const nextAccount = { id: 2, name: "An", grade: null };
    const nextProgress = { ...emptyProgress, interests: { universityIds: ["ftu"], categoryIds: ["business"] } };
    api.mockResolvedValueOnce(nextAccount).mockResolvedValueOnce(nextProgress);
    await act(async () => current.login("second-token"));
    await act(async () => { oldSave.resolve({ ok: true }); });
    expect(writes()).toHaveLength(1);
    expect(writes()[0][2]).toBe("saved-token");
    expect(current.progress).toEqual(nextProgress);
    expect(current.saveStatus).toBe("idle");

    api.mockResolvedValueOnce({ ok: true });
    await act(async () => current.updateProgress((progress) => ({
      ...progress, interests: { universityIds: [], categoryIds: [] }
    })));
    expect(writes()).toHaveLength(2);
    expect(writes()[1][2]).toBe("second-token");
    expect(JSON.parse(writes()[1][1]!.body as string)).toEqual(emptyProgress);
  });

  it("blocks edits and saves until a stored session has fully restored", async () => {
    localStorage.setItem(tokenKey, "saved-token");
    const accountRequest = deferred<AuthUser>();
    const progressRequest = deferred<Progress>();
    api.mockReturnValueOnce(accountRequest.promise).mockReturnValueOnce(progressRequest.promise);
    act(() => root.render(<Probe />));
    const edit = vi.fn((progress: Progress) => ({ ...progress, completedTaskIds: ["payment"] }));

    expect(current.sessionLoading).toBe(true);
    act(() => current.updateProgress(edit));
    expect(edit).not.toHaveBeenCalled();
    expect(writes()).toHaveLength(0);

    await act(async () => { accountRequest.resolve(account); });
    expect(current.sessionLoading).toBe(true);
    expect(current.user).toBeNull();
    await act(async () => { progressRequest.resolve(emptyProgress); });

    expect(current.progress).toEqual(emptyProgress);
    expect(current.user).toEqual(account);
    expect(current.sessionLoading).toBe(false);
    expect(writes()).toHaveLength(0);
  });

  it("keeps the token after a temporary restore failure and allows edits after retry", async () => {
    localStorage.setItem(tokenKey, "saved-token");
    api.mockResolvedValueOnce(account).mockRejectedValueOnce(new Error("Offline"));
    await act(async () => root.render(<Probe />));
    const edit = vi.fn((progress: Progress) => ({ ...progress, completedTaskIds: ["payment"] }));

    expect(current.sessionLoading).toBe(false);
    expect(current.sessionError).not.toBe("");
    expect(localStorage.getItem(tokenKey)).toBe("saved-token");
    act(() => current.updateProgress(edit));
    expect(edit).not.toHaveBeenCalled();
    expect(writes()).toHaveLength(0);

    api.mockResolvedValueOnce(account).mockResolvedValueOnce(emptyProgress);
    await act(async () => { await current.retrySession(); });
    expect(current.sessionError).toBe("");
    expect(current.progress).toEqual(emptyProgress);
    api.mockResolvedValueOnce({ ok: true });
    await act(async () => current.updateProgress(edit));

    expect(edit).toHaveBeenCalledOnce();
    expect(writes()).toHaveLength(1);
    expect(JSON.parse(writes()[0][1]!.body as string)).toEqual({
      ...emptyProgress, completedTaskIds: ["payment"]
    });
    expect(writes()[0][2]).toBe("saved-token");
    expect(current.saveStatus).toBe("saved");
  });

  it("clears an expired token and returns to guest mode on a 401", async () => {
    localStorage.setItem(tokenKey, "expired-token");
    api.mockRejectedValueOnce(new ApiError("Expired", 401)).mockResolvedValueOnce(emptyProgress);
    await act(async () => root.render(<Probe />));

    expect(localStorage.getItem(tokenKey)).toBeNull();
    expect(current.user).toBeNull();
    expect(current.sessionLoading).toBe(false);
    expect(current.sessionError).toBe("");
    expect(current.sessionNotice).not.toBe("");
    expect(current.progress).not.toEqual(emptyProgress);
    act(() => current.updateProgress(() => emptyProgress));
    expect(current.progress).toEqual(emptyProgress);
    expect(writes()).toHaveLength(0);
  });

  it("waits for a pending save before logging out", async () => {
    await mountSavedAccount();
    const saveRequest = deferred<{ ok: boolean }>();
    api.mockReturnValueOnce(saveRequest.promise);
    act(() => current.updateProgress((progress) => ({ ...progress, completedTaskIds: ["payment"] })));
    expect(current.saveStatus).toBe("saving");
    let signingOut!: Promise<void>;
    act(() => { signingOut = current.logout(); });

    expect(localStorage.getItem(tokenKey)).toBe("saved-token");
    expect(current.user).toEqual(account);
    expect(writes()).toHaveLength(1);
    await act(async () => {
      saveRequest.resolve({ ok: true });
      await signingOut;
    });

    expect(localStorage.getItem(tokenKey)).toBeNull();
    expect(current.user).toBeNull();
    expect(current.saveStatus).toBe("idle");
    expect(current.progress.completedTaskIds).not.toContain("payment");
    expect(current.progress.interests).toEqual({ universityIds: [], categoryIds: [] });
  });

  it("stays signed in with the local edit when saving during logout fails", async () => {
    await mountSavedAccount();
    api.mockRejectedValueOnce(new Error("Offline"));
    await act(async () => current.updateProgress((progress) => ({ ...progress, completedTaskIds: ["payment"] })));
    expect(current.saveStatus).toBe("error");
    api.mockRejectedValueOnce(new Error("Still offline"));

    await act(async () => { await current.logout(); });

    expect(localStorage.getItem(tokenKey)).toBe("saved-token");
    expect(current.user).toEqual(account);
    expect(current.progress.completedTaskIds).toEqual(["payment"]);
    expect(current.saveStatus).toBe("error");
  });
});
