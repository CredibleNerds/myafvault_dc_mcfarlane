import type { CatalogProduct } from "@/lib/types";
import raw from "./catalog.json";

function releaseYearValue(year: CatalogProduct["releaseYear"]): number {
  if (typeof year === "number" && Number.isFinite(year) && year > 0) return year;
  if (typeof year === "string") {
    const n = Number.parseInt(year, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return -1;
}

/** Newest release year first; original catalog order is kept within a year. */
export const CATALOG: CatalogProduct[] = [...(raw as CatalogProduct[])].sort(
  (a, b) => releaseYearValue(b.releaseYear) - releaseYearValue(a.releaseYear),
);

export const CATALOG_BY_ID: Record<string, CatalogProduct> = Object.fromEntries(
  CATALOG.map((p) => [p.id, p]),
);

export function catalogYear(product: Pick<CatalogProduct, "releaseYear">): number {
  return releaseYearValue(product.releaseYear);
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
