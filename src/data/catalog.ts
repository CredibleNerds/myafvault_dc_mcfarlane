import type { CatalogProduct } from "@/lib/types";
import raw from "./catalog.json";

export const CATALOG: CatalogProduct[] = raw as CatalogProduct[];

export const CATALOG_BY_ID: Record<string, CatalogProduct> = Object.fromEntries(
  CATALOG.map((p) => [p.id, p]),
);

export function catalogStats() {
  const byCategory = { "7-inch": 0, megafig: 0, multipack: 0, vehicle: 0 };
  for (const p of CATALOG) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  }
  return {
    total: CATALOG.length,
    byCategory,
  };
}
