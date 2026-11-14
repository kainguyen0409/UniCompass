import { z } from "zod";

export const routeSchema = z.enum(["all", "thpt", "hsa", "sat"]);
export const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(6000) }).strict()).max(10).default([]),
  context: z.object({ view: z.enum(["roadmap", "benchmarks", "sources"]), route: routeSchema }).strict().optional()
}).strict().refine(v => v.message.length + v.history.reduce((n, m) => n + m.content.length, 0) <= 20000, "Conversation too long");
export type ChatRequest = z.infer<typeof requestSchema>;
export const answerSchema = z.object({
  sections: z.array(z.object({ text: z.string().min(1).max(1800), sourceIds: z.array(z.string()).max(8) }).strict()).min(1).max(5),
  programRefs: z.array(z.string()).max(6),
  milestoneIds: z.array(z.string()).max(6)
}).strict();
export class AssistantError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function positiveEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid ${name}`);
  return value;
}
export function config() {
  return {
    enabled: process.env.AI_ENABLED === "true" && !!process.env.GROQ_API_KEY,
    model: process.env.AI_MODEL || "openai/gpt-oss-120b",
    timeout: positiveEnv("AI_REQUEST_TIMEOUT_MS", 45000),
    maxOutput: positiveEnv("AI_MAX_OUTPUT_TOKENS", 4096),
    // Conservative byte bound also bounds token count for UTF-8 byte tokenizers.
    maxInput: positiveEnv("AI_MAX_INPUT_BYTES", 40000)
  };
}
