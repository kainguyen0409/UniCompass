import { Router } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { AssistantError, config, requestSchema } from "../assistant/contracts.js";
import { runAssistant } from "../assistant/agent.js";
import { readStudent } from "../assistant/tools.js";
import { createLimiter } from "../assistant/limits.js";

export function createAssistantRouter(deps = { run: runAssistant, student: readStudent, settings: config, limiter: createLimiter() }) {
  const router = Router();
  router.get("/status", (_req, res) => { res.json({ enabled: deps.settings().enabled, cycle: "2025" }); });
  router.post("/chat", requireAuth, async (req, res) => {
    const id = randomUUID();
    const start = Date.now();
    let release: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const disconnect = () => { if (!res.writableEnded) controller.abort(); };
    res.on("close", disconnect);
    try {
      const settings = deps.settings();
      if (!settings.enabled) throw new AssistantError(503, "Trợ lý chưa được bật. Bạn vẫn có thể xem lộ trình và điểm chuẩn.");
      const parsed = requestSchema.safeParse(req.body);
      if (!parsed.success) throw new AssistantError(400, "Câu hỏi hoặc lịch sử hội thoại không hợp lệ hoặc quá dài.");
      timer = setTimeout(() => controller.abort(new Error("deadline")), settings.timeout);
      // Race covers database reads too; the model receives the same abort signal.
      const deadline = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new AssistantError(504, "Tra cứu mất quá lâu hoặc đã dừng. Bạn thử lại nhé.")), { once: true });
      });
      const work = async () => {
        const student = await deps.student(req.userId!);
        controller.signal.throwIfAborted();
        release = deps.limiter.acquire(req.userId!);
        const result = await deps.run(parsed.data, student, controller.signal);
        controller.signal.throwIfAborted();
        return result;
      };
      const result = await Promise.race([work(), deadline]);
      console.info(JSON.stringify({ event: "assistant", requestId: id, model: settings.model, durationMs: Date.now() - start, ...result.metrics }));
      if (!res.destroyed) res.json({ ...result.answer, requestId: id });
    } catch (error) {
      const external = error as { status?: number; headers?: Headers };
      const failure = error instanceof AssistantError ? error : controller.signal.aborted
        ? new AssistantError(504, "Tra cứu mất quá lâu hoặc đã dừng. Bạn thử lại nhé.")
        : external.status === 429 ? new AssistantError(429, "Dịch vụ AI đang đạt giới hạn. Bạn thử lại sau nhé.", Math.min(3600, Math.max(1, Number(external.headers?.get?.("retry-after")) || 60)))
        : new AssistantError(502, "Chưa kết nối được dịch vụ AI. Bạn thử lại sau nhé.");
      console.warn(JSON.stringify({ event: "assistant_error", requestId: id, status: failure.status, durationMs: Date.now() - start }));
      if (!res.destroyed) {
        if (failure.retryAfter) res.setHeader("Retry-After", failure.retryAfter);
        res.status(failure.status).json({ error: failure.message, requestId: id, retryAfter: failure.retryAfter });
      }
    } finally {
      clearTimeout(timer); release?.(); res.off("close", disconnect);
    }
  });
  return router;
}
export default createAssistantRouter();
