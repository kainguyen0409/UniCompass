import { useEffect, useRef, useState } from "react";
import { apiFetch } from "./api";
import type { AssistantResponse, RouteFilter } from "../types";
export type ChatTurn = { question: string; answer: AssistantResponse };
export function useAssistant(token: string | undefined, context: { view: "roadmap" | "benchmarks" | "sources"; route: RouteFilter }) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [retryQuestion, setRetryQuestion] = useState("");
  const active = useRef<AbortController | null>(null);
  const version = useRef(0);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setAvailabilityError(false);
    void apiFetch<{ enabled: boolean }>("/api/assistant/status", { signal: controller.signal })
      .then(s => { if (!controller.signal.aborted) setEnabled(s.enabled === true); })
      .catch(() => { if (!controller.signal.aborted) { setEnabled(false); setAvailabilityError(true); } });
    return () => controller.abort();
  }, [availabilityVersion]);
  useEffect(() => {
    setTurns([]); setDraft(""); setPending(""); setError(""); setRetryQuestion("");
    return () => { version.current++; active.current?.abort(); active.current = null; };
  }, [token]);
  function cancel() {
    version.current++; active.current?.abort(); active.current = null;
    if (pending) setDraft(pending);
    setPending("");
  }
  function reset() {
    cancel(); setTurns([]); setDraft(""); setError(""); setRetryQuestion("");
  }
  async function send(question = draft) {
    const text = question.trim();
    if (!token || !enabled || active.current || !text || text.length > 2000) return;
    const controller = new AbortController();
    active.current = controller;
    const current = ++version.current;
    setPending(text); setDraft(""); setError(""); setRetryQuestion("");
    const history = turns.slice(-5).flatMap(t => [
      { role: "user", content: t.question },
      { role: "assistant", content: t.answer.sections.map(s => s.text).join("\n").slice(0, 6000) }
    ]);
    while (history.length && history.reduce((n, m) => n + m.content.length, text.length) > 20000) history.splice(0, 2);
    try {
      const answer = await apiFetch<AssistantResponse>("/api/assistant/chat", {
        method: "POST", signal: controller.signal, body: JSON.stringify({ message: text, history, context })
      }, token);
      if (current !== version.current || controller.signal.aborted) return;
      if (!answer || !Array.isArray(answer.sections) || !Array.isArray(answer.programs) || !Array.isArray(answer.sources) || !Array.isArray(answer.milestones)) throw new Error("Câu trả lời chưa đúng định dạng. Bạn thử lại nhé.");
      setTurns(items => [...items.slice(-19), { question: text, answer }]);
    } catch (e) {
      if (current !== version.current || controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Chưa nhận được câu trả lời."); setRetryQuestion(text); setDraft(text);
    } finally {
      if (current === version.current) { setPending(""); active.current = null; }
    }
  }
  return { turns, draft, setDraft, pending, error, retryQuestion, enabled, availabilityError,
    retryAvailability: () => setAvailabilityVersion(n => n + 1), send, cancel, reset };
}
