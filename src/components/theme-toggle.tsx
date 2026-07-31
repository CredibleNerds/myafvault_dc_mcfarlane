import { Contrast, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ContrastMode, type ThemeMode } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODES: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

const CONTRAST_MODES: {
  id: ContrastMode;
  label: string;
  short: string;
}[] = [
  { id: "normal", label: "Normal contrast", short: "Off" },
  { id: "high", label: "High contrast", short: "On" },
  { id: "system", label: "Match system contrast", short: "Auto" },
];

/** Compact theme + high-contrast controls for the app header. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode, contrast, setContrast, highContrast } = useTheme();

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end",
        className,
      )}
    >
      <div
        role="group"
        aria-label="Color theme"
        className="inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface p-0.5"
      >
        {MODES.map(({ id, label, Icon }) => {
          const active = mode === id;
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`${label} theme`}
              aria-pressed={active}
              title={label}
              onClick={() => setMode(id)}
              className={cn(
                "h-8 w-8 px-0 sm:h-8 sm:w-auto sm:px-2.5 gap-1.5",
                active
                  ? "bg-primary text-primary-fg hover:bg-primary hover:text-primary-fg shadow-sm"
                  : "text-muted hover:text-fg hover:bg-surface-2",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">
                {label}
              </span>
            </Button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label="Contrast"
        className="inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface p-0.5"
      >
        <span
          className="hidden md:inline-flex items-center gap-1 px-1.5 text-[10px] font-medium uppercase tracking-wide text-subtle"
          aria-hidden
        >
          <Contrast className="h-3 w-3" />
          HC
        </span>
        {CONTRAST_MODES.map(({ id, label, short }) => {
          const active = contrast === id;
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="ghost"
              aria-label={label}
              aria-pressed={active}
              title={
                id === "system"
                  ? `${label}${highContrast ? " (high)" : " (normal)"}`
                  : label
              }
              onClick={() => setContrast(id)}
              className={cn(
                "h-8 min-w-8 px-2 gap-1",
                active
                  ? highContrast && id !== "normal"
                    ? "bg-fg text-bg hover:bg-fg hover:text-bg shadow-sm"
                    : "bg-primary text-primary-fg hover:bg-primary hover:text-primary-fg shadow-sm"
                  : "text-muted hover:text-fg hover:bg-surface-2",
              )}
            >
              {id === "high" && (
                <Contrast className="h-3.5 w-3.5 md:hidden shrink-0" />
              )}
              <span className="text-xs font-medium">{short}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
