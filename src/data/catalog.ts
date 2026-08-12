import type { CatalogProduct } from "@/lib/types";
import raw from "./catalog.json";

function releaseKey(product: CatalogProduct): number {
  const year = product.releaseYear;
  if (typeof year !== "number" || !Number.isFinite(year) || year <= 0) return -1;
  const month =
    typeof product.releaseMonth === "number" &&
    product.releaseMonth >= 1 &&
    product.releaseMonth <= 12
      ? product.releaseMonth
      : 0;
  return year * 12 + month;
}

/** Newest year+month first; original order kept when dates match. */
export const CATALOG: CatalogProduct[] = [...(raw as CatalogProduct[])].sort(
  (a, b) => releaseKey(b) - releaseKey(a),
);

export const CATALOG_BY_ID: Record<string, CatalogProduct> = Object.fromEntries(
  CATALOG.map((p) => [p.id, p]),
);

export function catalogYear(product: Pick<CatalogProduct, "releaseYear">): number {
  const year = product.releaseYear;
  return typeof year === "number" && year > 0 ? year : -1;
}


export function catalogStats() {
  const byCategory: Record<string, number> = {
    "7-inch": 0,
    megafig: 0,
    statue: 0,
    multipack: 0,
    vehicle: 0,
  };
  for (const p of CATALOG) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  }
  return {
    total: CATALOG.length,
    byCategory,
  };
}
