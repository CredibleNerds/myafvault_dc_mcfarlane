import { useId } from "react";
import { cn } from "@/lib/utils";
import type { PlatinumKind } from "@/lib/product";

export function PlatinumMark({
  kind,
  size = 22,
  labeled = true,
  className,
}: {
  kind: PlatinumKind;
  size?: number;
  labeled?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const isRed = kind === "red";
  const label = isRed ? "Red Platinum" : "Platinum";
  const g = `pt-${uid}`;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5 shadow-md backdrop-blur-sm",
        isRed
          ? "border-primary/70 bg-primary text-primary-fg"
          : "border-muted bg-[linear-gradient(180deg,#f3f5f7_0%,#c8ced6_55%,#9aa3ae_100%)] text-[#1a1e24]",
        className,
      )}
      title={`${label} Edition`}
      aria-label={`${label} Edition`}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${g}-ring`} x1="20%" y1="0%" x2="80%" y2="100%">
            {isRed ? (
              <>
                <stop offset="0%" stopColor="#ffd0d6" />
                <stop offset="100%" stopColor="#7a1022" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#6b7280" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="14.5"
          fill={isRed ? "#8b1528" : "#eceff2"}
          stroke={`url(#${g}-ring)`}
          strokeWidth="2.4"
        />
        <text
          x="16"
          y="17.2"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isRed ? "#fff" : "#1a1e24"}
          fontSize="11"
          fontWeight="800"
          letterSpacing="-0.4"
        >
          {isRed ? "RP" : "Pt"}
        </text>
      </svg>
      {labeled && (
        <span className="pr-1 text-[10px] font-bold uppercase tracking-wide leading-none">
          {isRed ? "Red Plat" : "Platinum"}
        </span>
      )}
    </span>
  );
}
