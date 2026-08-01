import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { CATALOG_BY_ID } from "@/data/catalog";
import { randomBytes } from "node:crypto";

export type SharedVaultItem = {
  id: string;
  name: string;
  character: string;
  imageUrl: string | null;
  category: string;
  line: string;
  scale: string;
};

export type PublicVaultShare = {
  title: string;
  itemCount: number;
  items: SharedVaultItem[];
  updatedAt: string | null;
};

export type MyVaultShare = {
  token: string;
  title: string;
  itemCount: number;
  path: string;
  updatedAt: string | null;
} | null;

type CustomShareInput = {
  name: string;
  character?: string;
  imageUrl?: string | null;
  category?: string;
  line?: string;
  scale?: string;
};

type PublishInput = {
  productIds: string[];
  /** Public fields for custom (non-catalog) figures */
  customs?: Record<string, CustomShareInput>;
  title?: string;
};

function newToken(): string {
  return randomBytes(18).toString("base64url");
}

function vaultSharePath(token: string) {
  return `/share/vault/${token}`;
}

function isCustomMap(
  value: unknown,
): value is Record<string, CustomShareInput> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

async function loadSystemCovers(
  productIds: string[],
): Promise<Record<string, string>> {
  if (productIds.length === 0) return {};
  const sql = await getSql();
  try {
    const rows = await sql.query<{ product_id: string; image_url: string }>(
      `select product_id, image_url
       from system_product_images
       where product_id = any($1::text[])`,
      [productIds],
    );
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.product_id] = row.image_url;
    }
    return map;
  } catch {
    return {};
  }
}

async function buildItems(
  productIds: string[],
  customs: Record<string, CustomShareInput> = {},
): Promise<SharedVaultItem[]> {
  const unique = [...new Set(productIds.filter((id) => typeof id === "string" && id))];
  if (unique.length > 500) {
    throw new Error("Vault is too large to share (max 500 items).");
  }
  const covers = await loadSystemCovers(unique);
  const items: SharedVaultItem[] = [];

  for (const id of unique) {
    const catalog = CATALOG_BY_ID[id];
    if (catalog) {
      items.push({
        id,
        name: catalog.name,
        character: catalog.character,
        imageUrl: covers[id] ?? catalog.imageUrl ?? null,
        category: catalog.category,
        line: catalog.line,
        scale: catalog.scale,
      });
      continue;
    }
    const custom = customs[id];
    if (custom?.name?.trim()) {
      items.push({
        id,
        name: custom.name.trim().slice(0, 200),
        character: (custom.character ?? custom.name).trim().slice(0, 200),
        imageUrl: custom.imageUrl ?? null,
        category: custom.category ?? "7-inch",
        line: custom.line ?? "Custom",
        scale: custom.scale ?? '7"',
      });
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

/** Active share for the signed-in user (if any). */
export const getMyVaultShare = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MyVaultShare> => {
    const sql = await getSql();
    try {
      const rows = await sql.query<{
        token: string;
        title: string;
        items: unknown;
        updated_at: string;
      }>(
        `select token, title, items, updated_at::text as updated_at
         from vault_shares
         where user_id = $1 and revoked_at is null
         order by updated_at desc
         limit 1`,
        [context.userId],
      );
      const row = rows[0];
      if (!row) return null;
      const items = Array.isArray(row.items) ? row.items : [];
      return {
        token: row.token,
        title: row.title,
        itemCount: items.length,
        path: vaultSharePath(row.token),
        updatedAt: row.updated_at ?? null,
      };
    } catch {
      return null;
    }
  });

/**
 * Create or refresh the owner's public vault collection share from owned product IDs.
 * Reuses the existing active token when present so the link stays stable.
 */
export const publishVaultShare = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: PublishInput) => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid share payload");
    }
    if (!Array.isArray(data.productIds)) {
      throw new Error("productIds required");
    }
    const productIds = data.productIds
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, 500);
    const customs = isCustomMap(data.customs) ? data.customs : {};
    const title =
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim().slice(0, 80)
        : "My Vault";
    return { productIds, customs, title };
  })
  .handler(async ({ context, data }): Promise<MyVaultShare> => {
    const items = await buildItems(data.productIds, data.customs);
    if (items.length === 0) {
      throw new Error("Mark at least one figure In My Vault before sharing.");
    }

    const sql = await getSql();
    const existing = await sql.query<{ token: string }>(
      `select token from vault_shares
       where user_id = $1 and revoked_at is null
       order by updated_at desc
       limit 1`,
      [context.userId],
    );

    const token = existing[0]?.token ?? newToken();
    const itemsJson = JSON.stringify(items);

    const rows = await sql.query<{
      token: string;
      title: string;
      items: unknown;
      updated_at: string;
    }>(
      `insert into vault_shares (token, user_id, title, items, created_at, updated_at, revoked_at)
       values ($1, $2, $3, $4::jsonb, now(), now(), null)
       on conflict (token) do update
         set title = excluded.title,
             items = excluded.items,
             updated_at = now(),
             revoked_at = null
       returning token, title, items, updated_at::text as updated_at`,
      [token, context.userId, data.title, itemsJson],
    );

    const row = rows[0]!;
    const saved = Array.isArray(row.items) ? row.items : items;
    return {
      token: row.token,
      title: row.title,
      itemCount: saved.length,
      path: vaultSharePath(row.token),
      updatedAt: row.updated_at ?? null,
    };
  });

/** Revoke the owner's active vault share link(s). */
export const revokeVaultShare = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql.query(
      `update vault_shares
       set revoked_at = now(), updated_at = now()
       where user_id = $1 and revoked_at is null`,
      [context.userId],
    );
    return { ok: true };
  });

/** Public fetch — no auth. Returns only display fields. */
export const fetchPublicVaultShare = createServerFn({ method: "GET" })
  .validator((data: { token: string }) => {
    const token = typeof data?.token === "string" ? data.token.trim() : "";
    if (!token || token.length < 8 || token.length > 80) {
      throw new Error("Invalid share link");
    }
    if (!/^[A-Za-z0-9_-]+$/.test(token)) {
      throw new Error("Invalid share link");
    }
    return { token };
  })
  .handler(async ({ data }): Promise<PublicVaultShare> => {
    const sql = await getSql();
    const rows = await sql.query<{
      title: string;
      items: unknown;
      updated_at: string;
      revoked_at: string | null;
    }>(
      `select title, items, updated_at::text as updated_at, revoked_at::text as revoked_at
       from vault_shares
       where token = $1
       limit 1`,
      [data.token],
    );
    const row = rows[0];
    if (!row || row.revoked_at) {
      throw new Error("This vault collection link is unavailable.");
    }

    const raw = Array.isArray(row.items) ? row.items : [];
    const items: SharedVaultItem[] = [];
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      if (typeof e.id !== "string" || typeof e.name !== "string") continue;
      items.push({
        id: e.id,
        name: e.name,
        character: typeof e.character === "string" ? e.character : e.name,
        imageUrl: typeof e.imageUrl === "string" ? e.imageUrl : null,
        category: typeof e.category === "string" ? e.category : "7-inch",
        line: typeof e.line === "string" ? e.line : "",
        scale: typeof e.scale === "string" ? e.scale : "",
      });
    }

    return {
      title: row.title || "My Vault",
      itemCount: items.length,
      items,
      updatedAt: row.updated_at ?? null,
    };
  });
