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
/** High-contrast accessibility mode */
export type ContrastMode = "normal" | "high" | "system";

const STORAGE_KEY = "myafvault-theme";
const CONTRAST_KEY = "myafvault-contrast";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
  contrast: ContrastMode;
  highContrast: boolean;
  setContrast: (mode: ContrastMode) => void;
  toggleHighContrast: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSystemHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

function resolveMode(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemTheme() : mode;
}

function resolveContrast(contrast: ContrastMode): boolean {
  if (contrast === "high") return true;
  if (contrast === "normal") return false;
  return getSystemHighContrast();
}

function applyTheme(
  mode: ThemeMode,
  resolved: ResolvedTheme,
  contrast: ContrastMode,
  highContrast: boolean,
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.classList.toggle("contrast-more", highContrast);
  root.dataset.theme = resolved;
  root.dataset.themeMode = mode;
  root.dataset.contrast = highContrast ? "high" : "normal";
  root.dataset.contrastMode = contrast;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    if (highContrast) {
      meta.setAttribute("content", resolved === "dark" ? "#000000" : "#ffffff");
    } else {
      meta.setAttribute(
        "content",
        resolved === "dark" ? "#0a0b0e" : "#f4f5f7",
      );
    }
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

function readStoredContrast(): ContrastMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(CONTRAST_KEY);
    if (v === "normal" || v === "high" || v === "system") return v;
  } catch {
    /* private mode */
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [contrast, setContrastState] = useState<ContrastMode>(() =>
    readStoredContrast(),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveMode(readStoredMode()),
  );
  const [highContrast, setHighContrast] = useState(() =>
    resolveContrast(readStoredContrast()),
  );

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      const r = resolveMode(next);
      const hc = resolveContrast(contrast);
      setResolved(r);
      setHighContrast(hc);
      applyTheme(next, r, contrast, hc);
    },
    [contrast],
  );

  const setContrast = useCallback(
    (next: ContrastMode) => {
      setContrastState(next);
      try {
        window.localStorage.setItem(CONTRAST_KEY, next);
      } catch {
        /* ignore */
      }
      const hc = resolveContrast(next);
      const r = resolveMode(mode);
      setHighContrast(hc);
      applyTheme(mode, r, next, hc);
    },
    [mode],
  );

  const cycleMode = useCallback(() => {
    setMode(
      mode === "system" ? "light" : mode === "light" ? "dark" : "system",
    );
  }, [mode, setMode]);

  const toggleHighContrast = useCallback(() => {
    // Explicit on/off — leave "system" for OS-driven preference
    if (contrast === "system") {
      setContrast(highContrast ? "normal" : "high");
    } else {
      setContrast(contrast === "high" ? "normal" : "high");
    }
  }, [contrast, highContrast, setContrast]);

  useEffect(() => {
    const r = resolveMode(mode);
    const hc = resolveContrast(contrast);
    setResolved(r);
    setHighContrast(hc);
    applyTheme(mode, r, contrast, hc);

    const colorMq = window.matchMedia("(prefers-color-scheme: dark)");
    const contrastMq = window.matchMedia("(prefers-contrast: more)");

    const onColor = () => {
      if (mode !== "system") return;
      const next = getSystemTheme();
      setResolved(next);
      applyTheme(mode, next, contrast, resolveContrast(contrast));
    };
    const onContrast = () => {
      if (contrast !== "system") return;
      const next = getSystemHighContrast();
      setHighContrast(next);
      applyTheme(mode, resolveMode(mode), contrast, next);
    };

    colorMq.addEventListener("change", onColor);
    contrastMq.addEventListener("change", onContrast);
    return () => {
      colorMq.removeEventListener("change", onColor);
      contrastMq.removeEventListener("change", onContrast);
    };
  }, [mode, contrast]);

  const value = useMemo(
    () => ({
      mode,
      resolved,
      setMode,
      cycleMode,
      contrast,
      highContrast,
      setContrast,
      toggleHighContrast,
    }),
    [
      mode,
      resolved,
      setMode,
      cycleMode,
      contrast,
      highContrast,
      setContrast,
      toggleHighContrast,
    ],
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
 * Inline head script — theme + contrast before paint (no flash).
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var tk=${JSON.stringify(STORAGE_KEY)};var ck=${JSON.stringify(CONTRAST_KEY)};var m=localStorage.getItem(tk)||"system";if(m!=="light"&&m!=="dark"&&m!=="system")m="system";var c=localStorage.getItem(ck)||"system";if(c!=="normal"&&c!=="high"&&c!=="system")c="system";var dark=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=dark?"dark":"light";var hc=c==="high"||(c==="system"&&window.matchMedia("(prefers-contrast: more)").matches);var d=document.documentElement;d.classList.toggle("dark",dark);d.classList.toggle("light",!dark);d.classList.toggle("contrast-more",hc);d.dataset.theme=r;d.dataset.themeMode=m;d.dataset.contrast=hc?"high":"normal";d.dataset.contrastMode=c;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",hc?(dark?"#000000":"#ffffff"):(dark?"#0a0b0e":"#f4f5f7"));}catch(e){}})();`;
