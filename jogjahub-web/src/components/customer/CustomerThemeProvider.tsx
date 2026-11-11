"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

export type CustomerTheme = "jogjahub" | "ocean" | "forest" | "lavender";

export const CUSTOMER_THEMES: Record<CustomerTheme, {
  label: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    soft: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
  };
}> = {
  jogjahub: {
    label: "JogjaHub",
    description: "Oranye hangat dan navy",
    colors: {
      primary: "#A04100",
      accent: "#FF6B00",
      soft: "#FFF0E5",
      background: "#F0F4FF",
      surface: "#FFFFFF",
      border: "#DFE6F3",
      text: "#121C2A",
      muted: "#4B596B",
    },
  },
  ocean: {
    label: "Samudra",
    description: "Biru tenang dan cerah",
    colors: {
      primary: "#075985",
      accent: "#0284C7",
      soft: "#E0F2FE",
      background: "#F0F9FF",
      surface: "#FFFFFF",
      border: "#BAE6FD",
      text: "#0C2638",
      muted: "#40596B",
    },
  },
  forest: {
    label: "Rimbun",
    description: "Hijau segar dan natural",
    colors: {
      primary: "#166534",
      accent: "#16A34A",
      soft: "#DCFCE7",
      background: "#F0FDF4",
      surface: "#FFFFFF",
      border: "#BBF7D0",
      text: "#14291C",
      muted: "#465C4B",
    },
  },
  lavender: {
    label: "Senja",
    description: "Ungu lembut dan elegan",
    colors: {
      primary: "#6D28D9",
      accent: "#8B5CF6",
      soft: "#F3E8FF",
      background: "#FAF7FF",
      surface: "#FFFFFF",
      border: "#E9D5FF",
      text: "#24143A",
      muted: "#58486B",
    },
  },
};

const THEME_STORAGE_KEY = "jogjahub_customer_theme";
const THEME_CHANGE_EVENT = "jogjahub-customer-theme-change";
let currentTheme: CustomerTheme = "jogjahub";

interface CustomerThemeContextValue {
  theme: CustomerTheme;
  setTheme: (theme: CustomerTheme) => void;
  isHydrated: boolean;
  storageError: string | null;
}

const CustomerThemeContext = createContext<CustomerThemeContextValue | null>(null);

function isCustomerTheme(value: string): value is CustomerTheme {
  return Object.prototype.hasOwnProperty.call(CUSTOMER_THEMES, value);
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getThemeSnapshot(): CustomerTheme {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    currentTheme = savedTheme && isCustomerTheme(savedTheme) ? savedTheme : "jogjahub";
  } catch {
    return currentTheme;
  }
  return currentTheme;
}

function getServerThemeSnapshot(): CustomerTheme {
  return "jogjahub";
}

function getHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function CustomerThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const isHydrated = useSyncExternalStore(subscribeToTheme, getHydrationSnapshot, getServerHydrationSnapshot);
  const [storageError, setStorageError] = useState<string | null>(null);

  const setTheme = useCallback((nextTheme: CustomerTheme) => {
    currentTheme = nextTheme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      setStorageError(null);
    } catch {
      setStorageError("Tema diterapkan untuk sesi ini, tetapi tidak dapat disimpan di browser.");
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, isHydrated, storageError }),
    [theme, setTheme, isHydrated, storageError],
  );
  const colors = CUSTOMER_THEMES[theme].colors;
  const themeStyle: CSSProperties & Record<`--customer-${string}`, string> = {
    "--customer-primary": colors.primary,
    "--customer-accent": colors.accent,
    "--customer-primary-soft": colors.soft,
    "--customer-background": colors.background,
    "--customer-surface": colors.surface,
    "--customer-border": colors.border,
    "--customer-text": colors.text,
    "--customer-muted": colors.muted,
  };

  return (
    <CustomerThemeContext.Provider value={value}>
      <div
        data-customer-theme={theme}
        style={themeStyle}
        className="min-h-dvh bg-[var(--customer-background)] text-[var(--customer-text)]"
      >
        {children}
      </div>
    </CustomerThemeContext.Provider>
  );
}

export function useCustomerTheme() {
  const context = useContext(CustomerThemeContext);
  if (!context) throw new Error("useCustomerTheme harus dipakai di dalam <CustomerThemeProvider>");
  return context;
}
