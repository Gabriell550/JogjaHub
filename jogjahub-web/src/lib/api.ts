import { getSession } from "@/src/lib/auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): Record<string, string> {
  const token = getSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method: string, endpoint: string, payload?: unknown, signal?: AbortSignal, accept = "application/json") {
  const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Accept: accept,
      ...authHeaders(),
      ...(payload !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
    },
    body: payload === undefined || isFormData ? payload as FormData | undefined : JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: unknown; errors?: Record<string, string[]> } | null;
    const validation = Object.values(body?.errors ?? {}).flat().filter((value) => typeof value === "string");
    const fallback = response.status === 401 ? "Sesi berakhir. Silakan masuk kembali."
      : response.status === 403 ? "Akses ditolak." : `Permintaan gagal (${response.status}).`;
    const message = validation.length ? [...new Set(validation)].join(" ")
      : typeof body?.message === "string" ? body.message : fallback;
    throw new ApiError(message, response.status, body?.errors);
  }

  return response;
}

export async function apiGet<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  return (await request("GET", endpoint, undefined, signal)).json();
}

export async function apiGetBlob(endpoint: string, signal?: AbortSignal): Promise<Blob> {
  return (await request("GET", endpoint, undefined, signal, "*/*")).blob();
}

async function send<T>(method: string, endpoint: string, payload?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await request(method, endpoint, payload, signal);
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const apiPost = <T>(endpoint: string, payload?: unknown, signal?: AbortSignal) => send<T>("POST", endpoint, payload, signal);
export const apiPatch = <T>(endpoint: string, payload?: unknown) => send<T>("PATCH", endpoint, payload);
export const apiPut = <T>(endpoint: string, payload: unknown) => send<T>("PUT", endpoint, payload);
export const apiDelete = <T>(endpoint: string) => send<T>("DELETE", endpoint);

export interface Resource<T> {
  data: T;
  message?: string;
}

export interface Page<T> extends Resource<T[]> {
  meta: { current_page: number; last_page: number; total: number; per_page: number };
}
