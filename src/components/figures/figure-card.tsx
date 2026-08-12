import type { CatalogProduct, UserEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  displayImageFor,
  formatRelease,
  platinumKind,
} from "@/lib/product";

import { ProductImage } from "@/components/figures/product-image";
import { PlatinumMark } from "@/components/figures/platinum-mark";

import { OWNERSHIP } from "@/lib/ownership-copy";
import { Check, Square, SquareCheck } from "lucide-react";

interface FigureCardProps {
  product: CatalogProduct;
  entry?: UserEntry | null;
  /** Admin system default cover for this listing (shared) */
  systemCover?: string | null;
  onClick: () => void;
  className?: string;
  /** Multi-select / bulk mode */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

/** Red checkmark + "In My Vault" chip next to the title (not over the photo). */
function VaultedMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex shrink-0 items-center gap-1.5",
        className,
      )}
      title={OWNERSHIP.titleYes}
      aria-label={OWNERSHIP.ariaYes}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-fg">
        <Check className="h-3 w-3 stroke-[3]" aria-hidden />
      </span>
      <span className="owned-badge inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-tight text-primary-fg">
        {OWNERSHIP.status}
      </span>
    </span>
  );
}

/** Blue checkmark + "Wishlist" chip next to the title. */
function WishlistMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex shrink-0 items-center gap-1.5",
        className,
      )}
      title="On wishlist"
      aria-label="On wishlist"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-wishlist text-wishlist-fg">
        <Check className="h-3 w-3 stroke-[3]" aria-hidden />
      </span>
      <span className="wishlist-badge inline-flex items-center rounded-full bg-wishlist px-2 py-0.5 text-[10px] font-semibold tracking-tight text-wishlist-fg">
        Wishlist
      </span>
    </span>
  );
}

export function FigureCard({
  product,
  entry,
  systemCover = null,
  onClick,
  className,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: FigureCardProps) {
  const src = displayImageFor(product, entry, systemCover);
  const owned = entry?.owned;
  const wishlist = entry?.wishlist;
  const wishOnly = !!wishlist && !owned;
  const platinum = platinumKind(product);

  return (
    <button
      type="button"
      onClick={() => {
        if (selectMode) {
          onToggleSelect?.();
          return;
        }
        onClick();
      }}
      aria-pressed={selectMode ? selected : undefined}
      className={cn(
        "figure-card group flex w-full flex-col overflow-hidden rounded-[var(--radius-xl)] border bg-surface text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        owned && !selected
          ? "figure-card--owned border-primary shadow-[0_0_0_1px_var(--color-primary),0_8px_28px_rgba(196,30,58,0.22)]"
          : wishOnly && !selected
            ? "figure-card--wishlist border-wishlist shadow-[0_0_0_1px_var(--color-wishlist),0_8px_28px_rgba(43,111,255,0.22)]"
            : "border-border",
        selected &&
          "border-primary ring-2 ring-primary shadow-[0_0_0_1px_var(--color-primary),0_8px_28px_rgba(196,30,58,0.28)]",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden bg-surface-2",
          owned && "ring-2 ring-inset ring-primary",
          wishOnly && "ring-2 ring-inset ring-wishlist",
          selected && "ring-2 ring-inset ring-primary",
        )}
      >
        <ProductImage
          src={src}
          alt={product.name}
          className="absolute inset-0 h-full w-full"
          imgClassName="p-1 sm:p-1.5"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Selection control */}
        {selectMode && (
          <div className="absolute left-2 top-2 z-[3]">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border shadow-md",
                selected
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-bg/90 text-muted backdrop-blur-sm",
              )}
              aria-hidden
            >
              {selected ? (
                <SquareCheck className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </span>
          </div>
        )}

        {/* Category (top-left, shifts when select mode) */}
        <div
          className={cn(
            "pointer-events-none absolute z-[1] flex flex-col gap-1",
            selectMode ? "left-2 top-12" : "left-2 top-2",
          )}
        >
          <Badge
            variant="secondary"
            className="bg-bg/85 text-[10px] backdrop-blur-sm"
          >
            {categoryLabel(product.category)}
          </Badge>
          {entry?.isCustom && (
            <Badge className="bg-fg/85 text-[10px] text-bg backdrop-blur-sm">
              My listing
            </Badge>
          )}
        </div>

        {platinum && (
          <div className="pointer-events-none absolute right-2 top-2 z-[2]">
            <PlatinumMark kind={platinum} size={18} />
          </div>
        )}

        {owned && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1 bg-primary"
            aria-hidden
          />
        )}
        {wishOnly && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1 bg-wishlist"
            aria-hidden
          />
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-1 p-3.5",
          owned && "bg-primary/[0.06]",
          wishOnly && "bg-wishlist/[0.07]",
          selected && "bg-primary/10",
        )}
      >
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 font-semibold leading-snug text-fg line-clamp-2 text-sm sm:text-[15px]">
            {product.name}
          </h3>
          {owned && <VaultedMark />}
          {wishOnly && <WishlistMark />}
        </div>
        <p className="text-xs text-muted line-clamp-1">{product.character}</p>
        {(product.line || product.releaseYear) && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-subtle line-clamp-1">
            {product.line}
            {product.line && product.releaseYear ? " · " : ""}
            {formatRelease(product)}
          </p>
        )}

        {product.accessories.length > 0 && (
          <p className="mt-0.5 text-[11px] text-subtle line-clamp-2 leading-snug">
            {product.accessories[0]}
          </p>
        )}
      </div>
    </button>
  );
}

export function FigureListRow({
  product,
  entry,
  systemCover = null,
  onClick,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: FigureCardProps) {
  const src = displayImageFor(product, entry, systemCover);
  const owned = entry?.owned;
  const wishlist = entry?.wishlist;
  const wishOnly = !!wishlist && !owned;
  const platinum = platinumKind(product);

  return (
    <button
      type="button"
      onClick={() => {
        if (selectMode) {
          onToggleSelect?.();
          return;
        }
        onClick();
      }}
      aria-pressed={selectMode ? selected : undefined}
      className={cn(
        "figure-list-row flex w-full items-center gap-3 rounded-[var(--radius-lg)] border bg-surface p-2.5 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:p-3",
        owned
          ? "border-primary bg-primary/[0.06] shadow-[inset_3px_0_0_0_var(--color-primary)]"
          : wishOnly
            ? "border-wishlist bg-wishlist/[0.07] shadow-[inset_3px_0_0_0_var(--color-wishlist)]"
            : "border-border hover:border-border-strong",
        selected && "border-primary ring-2 ring-primary bg-primary/10",
      )}
    >
      {selectMode && (
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            selected
              ? "border-primary bg-primary text-primary-fg"
              : "border-border bg-surface-2 text-muted",
          )}
          aria-hidden
        >
          {selected ? (
            <SquareCheck className="h-5 w-5" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </span>
      )}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[var(--radius-sm)]",
          owned && "ring-2 ring-primary ring-offset-1 ring-offset-bg",
          wishOnly && "ring-2 ring-wishlist ring-offset-1 ring-offset-bg",
        )}
      >
        <ProductImage
          src={src}
          alt=""
          className="h-20 w-20 sm:h-24 sm:w-24"
          imgClassName="p-0.5"
          sizes="96px"
        />
        {platinum && (
          <div className="pointer-events-none absolute right-0.5 top-0.5">
            <PlatinumMark kind={platinum} size={16} labeled={false} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 font-semibold text-sm sm:text-base truncate">
            {product.name}
          </h3>
          {owned && <VaultedMark className="mt-0.5" />}
          {wishOnly && <WishlistMark className="mt-0.5" />}
        </div>
        <p className="text-xs text-muted truncate">
          {product.character} · {product.line} · {product.scale}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {categoryLabel(product.category)}
          </Badge>
          {platinum && <PlatinumMark kind={platinum} size={16} />}
          {product.releaseYear && (
            <span className="text-xs text-subtle tabular-nums">
              {formatRelease(product)}
            </span>
          )}
        </div>
      </div>
      {product.accessories[0] && (
        <p className="hidden max-w-[240px] text-xs text-subtle line-clamp-2 lg:block">
          {product.accessories[0]}
        </p>
      )}
    </button>
  );
}
