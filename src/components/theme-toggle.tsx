import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MODES: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

/** Compact 3-way theme control for the app header. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface p-0.5",
        className,
      )}
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
            <span className="hidden sm:inline text-xs font-medium">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
