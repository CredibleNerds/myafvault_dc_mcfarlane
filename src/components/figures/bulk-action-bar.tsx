import {
  Check,
  CheckCheck,
  Heart,
  HeartOff,
  Square,
  SquareCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  visibleCount: number;
  filteredCount: number;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  onSelectVisible: () => void;
  onSelectFiltered: () => void;
  onClearSelection: () => void;
  onMarkOwned: () => void;
  onMarkUnowned: () => void;
  onAddWishlist: () => void;
  onRemoveWishlist: () => void;
}

export function BulkActionBar({
  selectedCount,
  visibleCount,
  filteredCount,
  selectMode,
  onToggleSelectMode,
  onSelectVisible,
  onSelectFiltered,
  onClearSelection,
  onMarkOwned,
  onMarkUnowned,
  onAddWishlist,
  onRemoveWishlist,
}: BulkActionBarProps) {
  if (!selectMode) {
    return (
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleSelectMode}
        >
          <SquareCheck className="h-4 w-4" />
          Select figures
        </Button>
        <p className="hidden sm:block text-xs text-subtle">
          Bulk mark owned, unowned, or wishlist
        </p>
      </div>
    );
  }

  return (
    <div className="sticky bottom-3 z-30 sm:static sm:z-auto">
      <div className="rounded-[var(--radius-xl)] border border-primary/40 bg-surface/95 backdrop-blur-md shadow-xl shadow-black/40 p-3 sm:p-3.5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-fg tabular-nums">
                {selectedCount}
              </span>
              <p className="text-sm font-medium text-fg">
                selected
                <span className="text-muted font-normal">
                  {" "}
                  · of {visibleCount.toLocaleString()} shown
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleSelectMode}
            >
              <X className="h-4 w-4" />
              Done
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSelectVisible}
              disabled={visibleCount === 0}
            >
              <Square className="h-3.5 w-3.5" />
              Select shown
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSelectFiltered}
              disabled={filteredCount === 0}
              title={`Select all ${filteredCount} matching filter`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Select all matches
              {filteredCount > 0 && (
                <span className="tabular-nums opacity-70">
                  ({filteredCount})
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={selectedCount === 0}
            >
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
            <Button
              type="button"
              size="sm"
              onClick={onMarkOwned}
              disabled={selectedCount === 0}
            >
              <Check className="h-4 w-4" />
              Mark owned
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMarkUnowned}
              disabled={selectedCount === 0}
            >
              Mark unowned
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddWishlist}
              disabled={selectedCount === 0}
            >
              <Heart className="h-4 w-4" />
              Wishlist
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveWishlist}
              disabled={selectedCount === 0}
            >
              <HeartOff className="h-4 w-4" />
              Unwishlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
