import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

interface MultiSelectProps<T extends string> {
  label: string;
  values: T[];
  options: MultiSelectOption<T>[];
  onToggle: (value: T) => void;
  onClear: () => void;
  className?: string;
}

export function MultiSelect<T extends string>({
  label,
  values,
  options,
  onToggle,
  onClear,
  className,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const summary =
    values.length === 0
      ? label
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ?? label)
        : `${values.length} selected`;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
      >
        <span className="min-w-0 truncate text-left">{summary}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-[var(--radius-sm)] border border-border bg-surface p-1 shadow-lg sm:right-auto sm:min-w-full sm:w-max"
        >
          <button
            type="button"
            role="option"
            aria-selected={values.length === 0}
            onClick={() => {
              onClear();
            }}
            className="flex w-full items-center gap-2 rounded-[var(--radius-xs)] px-2 py-2 text-left text-sm hover:bg-surface-2"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border",
                values.length === 0
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-bg",
              )}
            >
              {values.length === 0 && <Check className="h-3 w-3" />}
            </span>
            {label}
          </button>
          {options.map((opt) => {
            const selected = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onToggle(opt.value)}
                className="flex w-full items-center gap-2 rounded-[var(--radius-xs)] px-2 py-2 text-left text-sm hover:bg-surface-2"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border",
                    selected
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-bg",
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
