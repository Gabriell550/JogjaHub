import { getSession } from "@/src/lib/auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function authHeaders(): Record<string, string> {
  const token = getSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function sendWithBody<T>(method: "POST" | "PATCH", endpoint: string, payload?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
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

    throw new Error((typeof body.message === "string" ? body.message : validationMessages) ?? `Permintaan gagal (${response.status}).`);
  }

  return result as T;
}

export const apiPost = <T>(endpoint: string, payload: unknown) => sendWithBody<T>("POST", endpoint, payload);
export const apiPatch = <T>(endpoint: string, payload?: unknown) => sendWithBody<T>("PATCH", endpoint, payload);
