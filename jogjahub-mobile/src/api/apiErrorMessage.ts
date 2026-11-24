import { isAxiosError } from 'axios';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) return fallback;
  if (!error.response || error.response.status >= 500) return fallback;
  const body = error.response.data;
  return Object.values(body?.errors ?? {}).flat()[0] || body?.message || fallback;
}
