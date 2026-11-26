"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, apiGet } from "@/src/lib/api";
import { useAuth } from "@/src/hooks/useAuth";

export function requestMessage(error: unknown) {
  return error instanceof Error ? error.message : "Permintaan gagal. Silakan coba lagi.";
}

export function useApiQuery<T>(endpoint: string | null) {
  const { logout, session } = useAuth();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ endpoint: string; revision: number; token?: string | null; data?: T; error?: string }>();
  const token = session?.token;

  useEffect(() => {
    if (!endpoint) return;
    const controller = new AbortController();
    apiGet<T>(endpoint, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult({ endpoint, revision, token, data });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      setResult({ endpoint, revision, token, error: requestMessage(error) });
    });
    return () => controller.abort();
  }, [endpoint, revision, token, logout]);

  const current = result?.endpoint === endpoint && result.revision === revision && result.token === token ? result : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: Boolean(endpoint && !current),
    reload: () => setRevision((value) => value + 1),
  };
}

export function useApiAction() {
  const { logout } = useAuth();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout();
      setError(requestMessage(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return { busy, error, run, setError };
}
