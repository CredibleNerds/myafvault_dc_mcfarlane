import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isAdminEmail } from "@/lib/admin";
import type { CatalogProduct, ProductCategory } from "@/lib/types";

const CATEGORIES: ProductCategory[] = [
  "7-inch",
  "megafig",
  "multipack",
  "vehicle",
  "statue",
];

export type CatalogOverridePatch = {
  name?: string;
  character?: string;
  category?: ProductCategory;
  line?: string;
  scale?: string;
  productType?: string;
  sku?: string;
  releaseYear?: number | null;
  releaseMonth?: number | null;
  description?: string;
  accessories?: string[];
};

export type CatalogOverrideRecord = {
  productId: string;
  patch: CatalogOverridePatch;
  hidden: boolean;
};

export type CatalogOverrideMap = Record<string, CatalogOverrideRecord>;

const adminMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { getSessionUser, requireUserId, authConfigured } = await import(
      "@/lib/auth/verify.server"
    );
    assertSameSiteRequest();
    const bearerToken = context.bearerToken as string | undefined;
    const userId = await requireUserId(bearerToken);
    const user = await getSessionUser(bearerToken);

    if (!authConfigured) {
      return next({
        context: { userId, bearerToken, email: user?.email ?? "dev@example.com" },
      });
    }

    if (!user?.email || !isAdminEmail(user.email)) {
      throw new Error("Forbidden: admin only");
    }
    return next({
      context: { userId, bearerToken, email: user.email },
    });
  });

function cleanPatch(raw: CatalogOverridePatch): CatalogOverridePatch {
  const patch: CatalogOverridePatch = {};
  if (typeof raw.name === "string") {
    const name = raw.name.trim();
    if (!name) throw new Error("Name is required");
    if (name.length > 200) throw new Error("Name is too long");
    patch.name = name;
  }
  if (typeof raw.character === "string") {
    patch.character = raw.character.trim().slice(0, 160);
  }
  if (raw.category) {
    if (!CATEGORIES.includes(raw.category)) {
      throw new Error("Invalid category");
    }
    patch.category = raw.category;
  }
  if (typeof raw.line === "string") {
    patch.line = raw.line.trim().slice(0, 80);
  }
  if (typeof raw.scale === "string") {
    patch.scale = raw.scale.trim().slice(0, 40);
  }
  if (typeof raw.productType === "string") {
    patch.productType = raw.productType.trim().slice(0, 60);
  }
  if (typeof raw.sku === "string") {
    patch.sku = raw.sku.trim().slice(0, 40);
  }
  if (raw.releaseYear === null) {
    patch.releaseYear = null;
  } else if (typeof raw.releaseYear === "number" && Number.isFinite(raw.releaseYear)) {
    const y = Math.round(raw.releaseYear);
    if (y < 1980 || y > 2035) throw new Error("Year must be between 1980 and 2035");
    patch.releaseYear = y;
  }
  if (raw.releaseMonth === null) {
    patch.releaseMonth = null;
  } else if (
    typeof raw.releaseMonth === "number" &&
    Number.isFinite(raw.releaseMonth)
  ) {
    const m = Math.round(raw.releaseMonth);
    if (m < 1 || m > 12) throw new Error("Month must be 1–12");
    patch.releaseMonth = m;
  }
  if (typeof raw.description === "string") {
    patch.description = raw.description.trim().slice(0, 8000);
  }
  if (Array.isArray(raw.accessories)) {
    patch.accessories = raw.accessories
      .map((a) => String(a).trim())
      .filter(Boolean)
      .slice(0, 40)
      .map((a) => a.slice(0, 300));
  }
  return patch;
}

export function applyCatalogOverride(
  product: CatalogProduct,
  record?: CatalogOverrideRecord | null,
): CatalogProduct {
  if (!record) return product;
  const p = record.patch;
  return {
    ...product,
    name: p.name ?? product.name,
    character: p.character ?? product.character,
    category: p.category ?? product.category,
    line: p.line ?? product.line,
    scale: p.scale ?? product.scale,
    productType: p.productType ?? product.productType,
    sku: p.sku ?? product.sku,
    releaseYear:
      p.releaseYear === undefined ? product.releaseYear : p.releaseYear,
    releaseMonth:
      p.releaseMonth === undefined ? product.releaseMonth : p.releaseMonth,
    description: p.description ?? product.description,
    accessories: p.accessories ?? product.accessories,
  };
}

export const fetchCatalogOverrides = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<CatalogOverrideMap> => {
    const sql = await getSql();
    try {
      const rows = await sql.query<{
        product_id: string;
        patch: CatalogOverridePatch | string;
        hidden: boolean;
      }>(`select product_id, patch, hidden from catalog_overrides`);
      const map: CatalogOverrideMap = {};
      for (const row of rows) {
        if (!row.product_id) continue;
        const patch =
          typeof row.patch === "string"
            ? (JSON.parse(row.patch) as CatalogOverridePatch)
            : (row.patch ?? {});
        map[row.product_id] = {
          productId: row.product_id,
          patch,
          hidden: !!row.hidden,
        };
      }
      return map;
    } catch (err) {
      console.warn("[catalog-overrides] fetch failed", err);
      return {};
    }
  });

export const saveCatalogOverride = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    (data: {
      productId: string;
      patch: CatalogOverridePatch;
      hidden?: boolean;
    }) => {
      if (!data?.productId || typeof data.productId !== "string") {
        throw new Error("productId required");
      }
      return {
        productId: data.productId.trim(),
        patch: cleanPatch(data.patch ?? {}),
        hidden: !!data.hidden,
      };
    },
  )
  .handler(async ({ context, data }): Promise<CatalogOverrideRecord> => {
    const sql = await getSql();
    await sql.query(
      `insert into catalog_overrides (product_id, patch, hidden, updated_by, updated_at)
       values ($1, $2::jsonb, $3, $4, now())
       on conflict (product_id) do update
         set patch = excluded.patch,
             hidden = excluded.hidden,
             updated_by = excluded.updated_by,
             updated_at = now()`,
      [data.productId, JSON.stringify(data.patch), data.hidden, context.userId],
    );
    return {
      productId: data.productId,
      patch: data.patch,
      hidden: data.hidden,
    };
  });

export const clearCatalogOverride = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: { productId: string }) => {
    if (!data?.productId || typeof data.productId !== "string") {
      throw new Error("productId required");
    }
    return { productId: data.productId.trim() };
  })
  .handler(async ({ data }): Promise<{ productId: string }> => {
    const sql = await getSql();
    await sql.query(`delete from catalog_overrides where product_id = $1`, [
      data.productId,
    ]);
    return { productId: data.productId };
  });
