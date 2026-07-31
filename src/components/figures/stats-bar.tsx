import type { ElementType } from "react";
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
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-3.5 py-3 sm:px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
          {label}
        </p>
        <p className="text-base font-semibold tabular-nums tracking-tight truncate sm:text-lg">
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
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
      <Stat icon={Box} label="In catalog" value={String(catalogTotal)} />
      <Stat icon={CheckCircle2} label="Owned" value={String(owned)} />
      <Stat icon={Heart} label="Wishlist" value={String(wishlist)} />
      <Stat icon={ImageIcon} label="Your photos" value={String(withPhotos)} />
      <div className="col-span-2 lg:col-span-1">
        <Stat
          icon={Box}
          label="Spent"
          value={spent > 0 ? formatCurrency(spent) : "—"}
        />
      </div>
    </div>
  );
}
