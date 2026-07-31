import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "myafvault-theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveMode(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemTheme() : mode;
}

function applyTheme(mode: ThemeMode, resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.dataset.theme = resolved;
  root.dataset.themeMode = mode;
  // Browser chrome (mobile status bar, etc.)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      resolved === "dark" ? "#0a0b0e" : "#f4f5f7",
    );
  }
}

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* private mode */
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveMode(readStoredMode()),
  );

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const r = resolveMode(next);
    setResolved(r);
    applyTheme(next, r);
  }, []);

  const cycleMode = useCallback(() => {
    setMode(
      mode === "system" ? "light" : mode === "light" ? "dark" : "system",
    );
  }, [mode, setMode]);

  // Apply on mount + follow system when mode is "system"
  useEffect(() => {
    const r = resolveMode(mode);
    setResolved(r);
    applyTheme(mode, r);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode !== "system") return;
      const next = getSystemTheme();
      setResolved(next);
      applyTheme("system", next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const value = useMemo(
    () => ({ mode, resolved, setMode, cycleMode }),
    [mode, resolved, setMode, cycleMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/**
 * Inline head script (string) to set theme before paint and avoid flash.
 * Inject via dangerouslySetInnerHTML in the root document head.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var m=localStorage.getItem(k)||"system";if(m!=="light"&&m!=="dark"&&m!=="system")m="system";var dark=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=dark?"dark":"light";var d=document.documentElement;d.classList.toggle("dark",dark);d.classList.toggle("light",!dark);d.dataset.theme=r;d.dataset.themeMode=m;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",dark?"#0a0b0e":"#f4f5f7");}catch(e){}})();`;
