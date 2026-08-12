import { useId } from "react";
import { cn } from "@/lib/utils";
import type { PlatinumKind } from "@/lib/product";

export function PlatinumMark({
  kind,
  size = 40,
  className,
}: {
  kind: PlatinumKind;
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const isRed = kind === "red";
  const label = isRed ? "Red Platinum Edition" : "Platinum Edition";
  const g = `pt-${uid}`;

  return (
    <span
      className={cn("inline-flex shrink-0 drop-shadow-md", className)}
      title={label}
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`${g}-metal`} x1="18%" y1="8%" x2="86%" y2="94%">
            {isRed ? (
              <>
                <stop offset="0%" stopColor="#ff6b7d" />
                <stop offset="42%" stopColor="#c41e3a" />
                <stop offset="100%" stopColor="#7a1022" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f4f6f8" />
                <stop offset="38%" stopColor="#c5ccd4" />
                <stop offset="72%" stopColor="#8b939e" />
                <stop offset="100%" stopColor="#5d6570" />
              </>
            )}
          </linearGradient>
          <linearGradient id={`${g}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="31" fill={`url(#${g}-metal)`} />
        <circle
          cx="32"
          cy="32"
          r="28.2"
          fill="none"
          stroke={isRed ? "#3a0810" : "#2a3038"}
          strokeWidth="1.2"
          opacity="0.55"
        />
        <circle
          cx="32"
          cy="32"
          r="22.4"
          fill="none"
          stroke={isRed ? "#2a060c" : "#1c2026"}
          strokeWidth="1.1"
          opacity="0.7"
        />
        <path
          d="M32 11.5 A20.5 20.5 0 0 1 32 52.5 A20.5 20.5 0 0 1 32 11.5"
          id={`${g}-arc`}
          fill="none"
        />
        <text
          fill={isRed ? "#fff5f6" : "#14181d"}
          fontSize="5.2"
          fontWeight="700"
          letterSpacing="1.4"
        >
          <textPath href={`#${g}-arc`} startOffset="22%">
            PLATINUM
          </textPath>
        </text>
        {/* Twin wing / chase mark */}
        <path
          d="M25.2 27.2c0 0 1.6-5.4 6.8-5.4s6.8 5.4 6.8 5.4c0 0-2.4-2.2-6.8-2.2s-6.8 2.2-6.8 2.2z"
          fill={isRed ? "#2a060c" : "#1a1e24"}
        />
        <path
          d="M20.6 34.2c2.2-4.8 6.2-7.4 11.4-7.4s9.2 2.6 11.4 7.4c-2.6-3.2-6.4-4.8-11.4-4.8s-8.8 1.6-11.4 4.8z"
          fill={isRed ? "#2a060c" : "#1a1e24"}
        />
        <path
          d="M23.8 41.6c2.1-3.6 5.1-5.4 8.2-5.4s6.1 1.8 8.2 5.4c-2.2-2.2-4.9-3.3-8.2-3.3s-6 1.1-8.2 3.3z"
          fill={isRed ? "#2a060c" : "#1a1e24"}
        />
        <ellipse
          cx="26"
          cy="20"
          rx="10"
          ry="6"
          fill={`url(#${g}-shine)`}
          transform="rotate(-28 26 20)"
        />
      </svg>
    </span>
  );
}
