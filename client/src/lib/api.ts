export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Pass the token explicitly so a queued save always belongs to the same account.
export async function apiFetch<T>(url: string, options: RequestInit = {}, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error("Chưa kết nối được. Bạn thử lại nhé.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error || "Chưa tải được dữ liệu. Bạn thử lại nhé.", response.status);
  }
  return response.json() as Promise<T>;
}
