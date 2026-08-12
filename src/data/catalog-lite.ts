import raw from "./catalog-lite.json";

export type CatalogLiteItem = {
  id: string;
  name: string;
  character: string;
  line: string;
  imageUrl: string | null;
};

export const CATALOG_LITE: CatalogLiteItem[] = raw as CatalogLiteItem[];

export const CATALOG_LITE_BY_ID: Record<string, CatalogLiteItem> =
  Object.fromEntries(CATALOG_LITE.map((p) => [p.id, p]));
