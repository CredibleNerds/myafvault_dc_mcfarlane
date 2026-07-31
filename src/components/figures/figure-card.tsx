import type { CatalogProduct, UserEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  displayImageFor,
} from "@/lib/product";
import { ProductImage } from "@/components/figures/product-image";
import { Check, Heart } from "lucide-react";

interface FigureCardProps {
  product: CatalogProduct;
  entry?: UserEntry | null;
  onClick: () => void;
  className?: string;
}

export function FigureCard({
  product,
  entry,
  onClick,
  className,
}: FigureCardProps) {
  const src = displayImageFor(product, entry);
  const owned = entry?.owned;
  const wishlist = entry?.wishlist;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "figure-card group flex w-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        owned && "border-primary/40",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
        <ProductImage
          src={src}
          alt={product.name}
          className="absolute inset-0 h-full w-full"
          imgClassName="p-1 sm:p-1.5"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="pointer-events-none absolute left-2 top-2 z-[1] flex flex-col gap-1">
          <Badge
            variant="secondary"
            className="bg-bg/85 text-[10px] backdrop-blur-sm"
          >
            {categoryLabel(product.category)}
          </Badge>
        </div>
        <div className="pointer-events-none absolute right-2 top-2 z-[1] flex gap-1">
          {owned && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-fg shadow">
              <Check className="h-3.5 w-3.5" />
            </span>
          )}
          {wishlist && !owned && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-primary shadow border border-border">
              <Heart className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-bg/90 via-bg/40 to-transparent p-2.5 pt-8">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {product.line}
            {product.releaseYear ? ` · ${product.releaseYear}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="font-semibold leading-snug text-fg line-clamp-2 text-sm sm:text-[15px]">
          {product.name}
        </h3>
        <p className="text-xs text-muted line-clamp-1">{product.character}</p>
        {product.accessories.length > 0 && (
          <p className="mt-1 text-[11px] text-subtle line-clamp-2 leading-snug">
            {product.accessories[0]}
          </p>
        )}
      </div>
    </button>
  );
}

export function FigureListRow({ product, entry, onClick }: FigureCardProps) {
  const src = displayImageFor(product, entry);
  const owned = entry?.owned;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "figure-list-row flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-2.5 text-left transition-colors hover:border-border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:p-3",
        owned && "border-primary/35",
      )}
    >
      <ProductImage
        src={src}
        alt=""
        className="h-20 w-20 shrink-0 rounded-[var(--radius-sm)] sm:h-24 sm:w-24"
        imgClassName="p-0.5"
        sizes="96px"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm sm:text-base truncate">
          {product.name}
        </h3>
        <p className="text-xs text-muted truncate">
          {product.character} · {product.line} · {product.scale}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {categoryLabel(product.category)}
          </Badge>
          {product.releaseYear && (
            <span className="text-xs text-subtle tabular-nums">
              {product.releaseYear}
            </span>
          )}
          {owned && (
            <Badge variant="default" className="text-[10px]">
              Owned
            </Badge>
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
