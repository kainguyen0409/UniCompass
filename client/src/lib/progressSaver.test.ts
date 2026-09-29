import { describe, expect, it, vi } from "vitest";
import type { Progress } from "../types";
import { createProgressSaver } from "./progressSaver";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function progress(thpt: number, completedTaskIds: string[] = [], universityIds: string[] = [], categoryIds: string[] = []): Progress {
  return { completedTaskIds, scores: { thpt, hsa: 106, sat: 1380 }, interests: { universityIds, categoryIds } };
}

describe("progress saving", () => {
  it("serializes requests and saves the latest edits after a slow request", async () => {
    const first = deferred();
    const save = vi.fn<(value: Progress) => Promise<unknown>>()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);
    const onStatus = vi.fn();
    const saver = createProgressSaver(save, onStatus);

    saver.enqueue(progress(25));
    saver.enqueue(progress(26, ["profile-review"], ["neu"], ["economics"]));
    const latest = progress(27, ["profile-review", "priority-admission"], ["neu", "ftu"], ["business", "finance"]);
    saver.enqueue(latest);

    expect(save).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("saving");
    first.resolve();
    expect(await saver.flush()).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(latest);
    expect(onStatus).toHaveBeenLastCalledWith("saved");
  });

  it("does not lose an edit arriving as the previous save completes", async () => {
    const first = deferred();
    const save = vi.fn<(value: Progress) => Promise<unknown>>()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);
    const saver = createProgressSaver(save, vi.fn());
    const latest = progress(28, ["profile-review"]);

    saver.enqueue(progress(25));
    const completion = saver.flush();
    first.resolve();
    queueMicrotask(() => saver.enqueue(latest));
    await completion;

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(latest);
  });

  it("keeps the newest snapshot after a failure and retries it explicitly", async () => {
    const first = deferred();
    const save = vi.fn<(value: Progress) => Promise<unknown>>()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);
    const onStatus = vi.fn();
    const saver = createProgressSaver(save, onStatus);
    const latest = progress(29, ["profile-review"], ["hust"], ["engineering"]);

    saver.enqueue(progress(25));
    saver.enqueue(latest);
    const failed = saver.flush();
    first.reject(new Error("Connection lost"));

    expect(await failed).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("error");
    expect(await saver.flush()).toBe(true);
    expect(save).toHaveBeenLastCalledWith(latest);
    expect(onStatus).toHaveBeenLastCalledWith("saved");
  });

  it("retries a failed snapshot even when there were no later edits", async () => {
    const save = vi.fn<(value: Progress) => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue(undefined);
    const saver = createProgressSaver(save, vi.fn());
    const snapshot = progress(26);

    saver.enqueue(snapshot);
    expect(await saver.flush()).toBe(false);
    expect(await saver.flush()).toBe(true);
    expect(save).toHaveBeenNthCalledWith(2, snapshot);
  });

  it("clones interest arrays so later mutations cannot change an in-flight or queued save", async () => {
    const first = deferred();
    const save = vi.fn<(value: Progress) => Promise<unknown>>()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);
    const saver = createProgressSaver(save, vi.fn());
    const inFlight = progress(25, [], ["neu"], ["economics"]);
    saver.enqueue(inFlight);
    inFlight.interests.universityIds.push("ftu");
    inFlight.interests.categoryIds.push("business");

    const queued = progress(27, ["profile-review"], ["hust"], ["computing"]);
    saver.enqueue(queued);
    queued.interests.universityIds.splice(0, 1, "uet");
    queued.interests.categoryIds.length = 0;
    expect(save.mock.calls[0][0].interests).toEqual({ universityIds: ["neu"], categoryIds: ["economics"] });

    first.resolve();
    expect(await saver.flush()).toBe(true);
    expect(save.mock.calls[1][0]).toEqual(progress(27, ["profile-review"], ["hust"], ["computing"]));
  });

  it("saves explicitly cleared interests after earlier choices", async () => {
    const save = vi.fn<(value: Progress) => Promise<unknown>>().mockResolvedValue(undefined);
    const saver = createProgressSaver(save, vi.fn());
    saver.enqueue(progress(26, ["profile-review"], ["uet"], ["computing"]));
    await saver.flush();
    saver.enqueue(progress(26, ["profile-review"]));
    await saver.flush();
    expect(save).toHaveBeenLastCalledWith(progress(26, ["profile-review"]));
  });

  it.each(["success", "failure"])("ignores pending work and late %s after disposal", async (result) => {
    const first = deferred();
    const save = vi.fn<(value: Progress) => Promise<unknown>>(() => first.promise);
    const onStatus = vi.fn();
    const saver = createProgressSaver(save, onStatus);

    saver.enqueue(progress(25));
    saver.enqueue(progress(26));
    const completion = saver.flush();
    saver.dispose();
    onStatus.mockClear();
    saver.enqueue(progress(27));
    if (result === "success") first.resolve();
    else first.reject(new Error("Connection lost"));

    expect(await completion).toBe(false);
    expect(await saver.flush()).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
    expect(onStatus).not.toHaveBeenCalled();
  });
});
