import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { UserEntry } from "@/lib/types";

export type VaultPayload = {
  entries: Record<string, UserEntry>;
  updatedAt: string | null;
};

function isEntryMap(value: unknown): value is Record<string, UserEntry> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Pull the signed-in user's cloud vault (empty if none yet). */
export const fetchCloudVault = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<VaultPayload> => {
    const sql = await getSql();
    const rows = await sql.query<{ entries: unknown; updated_at: string }>(
      `select entries, updated_at::text as updated_at
       from collection_vaults
       where user_id = $1
       limit 1`,
      [context.userId],
    );
    const row = rows[0];
    if (!row) {
      return { entries: {}, updatedAt: null };
    }
    return {
      entries: isEntryMap(row.entries) ? row.entries : {},
      updatedAt: row.updated_at ?? null,
    };
  });

/** Replace the signed-in user's vault with the provided entries map. */
export const saveCloudVault = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { entries: Record<string, UserEntry> }) => {
    if (!data || typeof data !== "object" || !isEntryMap(data.entries)) {
      throw new Error("Invalid vault payload");
    }
    const raw = JSON.stringify(data.entries);
    if (raw.length > 12_000_000) {
      throw new Error(
        "Collection is too large to sync. Remove some personal photos.",
      );
    }
    return data;
  })
  .handler(async ({ context, data }): Promise<VaultPayload> => {
    const sql = await getSql();
    const payload = JSON.stringify(data.entries);
    const rows = await sql.query<{ updated_at: string }>(
      `insert into collection_vaults (user_id, entries, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id) do update
         set entries = excluded.entries,
             updated_at = now()
       returning updated_at::text as updated_at`,
      [context.userId, payload],
    );
    return {
      entries: data.entries,
      updatedAt: rows[0]?.updated_at ?? new Date().toISOString(),
    };
  });
