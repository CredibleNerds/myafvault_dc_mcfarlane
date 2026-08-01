import type { ElementType } from "react";
import { OWNERSHIP } from "@/lib/ownership-copy";
import { Box, CheckCircle2, Heart, Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsBarProps {
  catalogTotal: number;
  owned: number;
  wishlist: number;
  withPhotos: number;
  spent: number;
}

function Stat({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon: ElementType;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5"
          : "flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-3.5 py-3 sm:px-4"
      }
    >
      {!compact && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0">
        <p
          className={
            compact
              ? "text-[10px] font-medium uppercase tracking-wide text-subtle flex items-center gap-1"
              : "text-[11px] font-medium uppercase tracking-wide text-subtle"
          }
        >
          {compact && <Icon className="h-3 w-3 text-primary shrink-0" />}
          <span className="truncate">{label}</span>
        </p>
        <p
          className={
            compact
              ? "text-base font-semibold tabular-nums tracking-tight"
              : "text-base font-semibold tabular-nums tracking-tight truncate sm:text-lg"
          }
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function StatsBar({
  catalogTotal,
  owned,
  wishlist,
  withPhotos,
  spent,
}: StatsBarProps) {
  return (
    <>
      {/* Mobile: denser 2×2 + spent strip */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <Stat
          compact
          icon={Box}
          label="Catalog"
          value={String(catalogTotal)}
        />
        <Stat
          compact
          icon={CheckCircle2}
          label={OWNERSHIP.countLabel}
          value={String(owned)}
        />
        <Stat
          compact
          icon={Heart}
          label="Wishlist"
          value={String(wishlist)}
        />
        <Stat
          compact
          icon={ImageIcon}
          label="Photos"
          value={String(withPhotos)}
        />
        {spent > 0 && (
          <div className="col-span-2">
            <Stat
              compact
              icon={Box}
              label="Spent"
              value={formatCurrency(spent)}
            />
          </div>
        )}
      </div>

      {/* Tablet / desktop */}
      <div className="hidden sm:grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Box} label="In catalog" value={String(catalogTotal)} />
        <Stat
          icon={CheckCircle2}
          label={OWNERSHIP.countLabel}
          value={String(owned)}
        />
        <Stat icon={Heart} label="Wishlist" value={String(wishlist)} />
        <Stat
          icon={ImageIcon}
          label="Your photos"
          value={String(withPhotos)}
        />
        <div className="col-span-2 lg:col-span-1">
          <Stat
            icon={Box}
            label="Spent"
            value={spent > 0 ? formatCurrency(spent) : "—"}
          />
        </div>
      </div>
    </>
  );
}
