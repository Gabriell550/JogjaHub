export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(endpoint: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = typeof result === "object" && result !== null
      ? result as { message?: unknown; errors?: unknown }
      : {};
    const validationMessages = typeof body.errors === "object" && body.errors !== null
      ? Object.values(body.errors as Record<string, unknown>)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .find((value): value is string => typeof value === "string")
      : undefined;
    const message = typeof body.message === "string" ? body.message : validationMessages;

    throw new Error(message ?? `Permintaan gagal (${response.status}).`);
  }

  return result as T;
}
