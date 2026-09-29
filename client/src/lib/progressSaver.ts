import type { Progress } from "../types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Send one snapshot at a time. While saving, keep only the newest pending edit.
export function createProgressSaver(
  save: (progress: Progress) => Promise<unknown>,
  onStatus: (status: SaveStatus) => void
) {
  // pending is the latest unsent state; flight lets callers wait for the active save loop.
  let pending: Progress | null = null;
  let flight: Promise<boolean> | null = null;
  let disposed = false;

  // Save in order until there are no newer edits waiting. Stop on failure so the
  // caller can offer a retry instead of repeatedly sending a failing request.
  async function drain(): Promise<boolean> {
    onStatus("saving");
    while (pending && !disposed) {
      const snapshot = pending;
      // Free the pending slot before waiting, so new edits can take its place.
      pending = null;
      try {
        await save(snapshot);
      } catch {
        if (!disposed) {
          // Preserve any newer edits for the retry.
          pending ??= snapshot;
          onStatus("error");
        }
        return false;
      }
    }
    return !disposed;
  }

  // Used for retries and sign-out: resolve true only when the queue has finished saving.
  function flush(): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    if (flight) return flight;
    if (!pending) return Promise.resolve(true);
    flight = drain().then((ok) => {
      flight = null;
      // An edit may arrive between the final await and this completion handler.
      if (ok && pending && !disposed) return flush();
      if (ok && !disposed) onStatus("saved");
      return ok;
    });
    return flight;
  }

  return {
    enqueue(progress: Progress) {
      if (disposed) return;
      // Copy the nested values so later edits can't change a queued snapshot.
      pending = {
        completedTaskIds: [...progress.completedTaskIds],
        scores: { ...progress.scores },
        interests: {
          universityIds: [...progress.interests.universityIds],
          categoryIds: [...progress.interests.categoryIds]
        }
      };
      void flush();
    },
    flush,
    // A request already sent may finish, but it must not trigger more saves or status updates.
    dispose() {
      disposed = true;
      pending = null;
    }
  };
}
