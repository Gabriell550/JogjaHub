import type { AuthSession } from "@/src/features/auth/types";

const SESSION_KEY = "jogjahub_session";

function storageFor(role: AuthSession["user"]["role"]): Storage {
  return role === "admin" ? window.sessionStorage : window.localStorage;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const sessionStorageValue = window.sessionStorage.getItem(SESSION_KEY);
  const localStorageValue = window.localStorage.getItem(SESSION_KEY);
  const raw = sessionStorageValue ?? localStorageValue;
  if (!raw) return null;

  let session: AuthSession;
  try {
    session = JSON.parse(raw) as AuthSession;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }

  if (session.user.role === "admin" && sessionStorageValue === null) {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return session;
}

export function setSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  const target = storageFor(session.user.role);
  const other = target === window.sessionStorage ? window.localStorage : window.sessionStorage;
  other.removeItem(SESSION_KEY);
  target.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}
