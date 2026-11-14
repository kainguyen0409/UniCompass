/** Only expose selected error fields, never SDK headers or request objects. */
export function verificationError(error: unknown, secret = process.env.GROQ_API_KEY) {
  const e = error as { status?: unknown; message?: unknown; error?: { message?: unknown; type?: unknown; code?: unknown; param?: unknown } } | null;
  const redact = (value: unknown) => {
    if (typeof value !== 'string') return undefined;
    let text = value;
    if (secret) text = text.split(secret).join('[REDACTED]');
    return text.replace(/\b(?:gsk_|sk-)[A-Za-z0-9_-]+/g, '[REDACTED]').replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]').slice(0, 1600);
  };
  return {
    status: typeof e?.status === 'number' ? e.status : undefined,
    message: redact(e?.error?.message ?? e?.message) ?? 'Unknown verification failure',
    type: redact(e?.error?.type), code: redact(e?.error?.code), param: redact(e?.error?.param)
  };
}
