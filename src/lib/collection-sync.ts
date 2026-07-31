import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { UserCollection, UserEntry } from "@/lib/types";

export type VaultPayload = {
  entries: Record<string, UserEntry>;
  collections: Record<string, UserCollection>;
  updatedAt: string | null;
};

function isEntryMap(value: unknown): value is Record<string, UserEntry> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isCollectionMap(
  value: unknown,
): value is Record<string, UserCollection> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Pull the signed-in user's cloud vault (empty if none yet). */
export const fetchCloudVault = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<VaultPayload> => {
    const sql = await getSql();
    const rows = await sql.query<{
      entries: unknown;
      collections: unknown;
      updated_at: string;
    }>(
      `select entries,
              coalesce(collections, '{}'::jsonb) as collections,
              updated_at::text as updated_at
       from collection_vaults
       where user_id = $1
       limit 1`,
      [context.userId],
    );
    const row = rows[0];
    if (!row) {
      return { entries: {}, collections: {}, updatedAt: null };
    }
    return {
      entries: isEntryMap(row.entries) ? row.entries : {},
      collections: isCollectionMap(row.collections) ? row.collections : {},
      updatedAt: row.updated_at ?? null,
    };
  });

/** Replace the signed-in user's vault with entries + collections. */
export const saveCloudVault = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      entries: Record<string, UserEntry>;
      collections?: Record<string, UserCollection>;
    }) => {
      if (!data || typeof data !== "object" || !isEntryMap(data.entries)) {
        throw new Error("Invalid vault payload");
      }
      const collections = isCollectionMap(data.collections)
        ? data.collections
        : {};
      const raw = JSON.stringify({ entries: data.entries, collections });
      if (raw.length > 14_000_000) {
        throw new Error(
          "Collection is too large to sync. Remove some personal photos.",
        );
      }
      return { entries: data.entries, collections };
    },
  )
  .handler(async ({ context, data }): Promise<VaultPayload> => {
    const sql = await getSql();
    const entriesJson = JSON.stringify(data.entries);
    const collectionsJson = JSON.stringify(data.collections);
    const rows = await sql.query<{ updated_at: string }>(
      `insert into collection_vaults (user_id, entries, collections, updated_at)
       values ($1, $2::jsonb, $3::jsonb, now())
       on conflict (user_id) do update
         set entries = excluded.entries,
             collections = excluded.collections,
             updated_at = now()
       returning updated_at::text as updated_at`,
      [context.userId, entriesJson, collectionsJson],
    );
    return {
      entries: data.entries,
      collections: data.collections,
      updatedAt: rows[0]?.updated_at ?? new Date().toISOString(),
    };
  });
