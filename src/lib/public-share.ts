import { createServerFn } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { CATALOG_BY_ID } from "@/data/catalog";

export type SharedFigureCard = {
  id: string;
  name: string;
  character: string;
  imageUrl: string | null;
  category: string;
  line: string;
  scale: string;
  description?: string;
  accessories?: string[];
  productUrl?: string;
  isCustom?: boolean;
};

export type SharedItemPayload = SharedFigureCard;

export type SharedCollectionPayload = {
  name: string;
  description: string;
  theme: string;
  photos: string[];
  figures: SharedFigureCard[];
};

export type PublicShareResult = {
  token: string;
  kind: "item" | "collection";
  title: string;
  path: string;
  updatedAt: string | null;
};

const MAX_PAYLOAD_CHARS = 3_500_000;

function newToken(): string {
  return randomBytes(18).toString("base64url");
}

function pathFor(kind: "item" | "collection", token: string) {
  return kind === "item" ? `/share/item/${token}` : `/share/collection/${token}`;
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
    for (const row of rows) map[row.product_id] = row.image_url;
    return map;
  } catch {
    return {};
  }
}

function figureFromCatalog(
  id: string,
  cover?: string | null,
): SharedFigureCard | null {
  const p = CATALOG_BY_ID[id];
  if (!p) return null;
  return {
    id,
    name: p.name,
    character: p.character,
    imageUrl: cover ?? p.imageUrl ?? null,
    category: p.category,
    line: p.line,
    scale: p.scale,
    description: p.description?.slice(0, 600) || undefined,
    accessories: (p.accessories ?? []).slice(0, 12),
    productUrl: p.productUrl || undefined,
  };
}

type ItemPublishInput = {
  productId: string;
  /** Required for custom figures; optional catalog overrides */
  custom?: {
    name: string;
    character?: string;
    imageUrl?: string | null;
    category?: string;
    line?: string;
    scale?: string;
    description?: string;
    accessories?: string[];
  };
};

type CollectionPublishInput = {
  collectionId: string;
  name: string;
  description?: string;
  theme?: string;
  photos?: string[];
  productIds?: string[];
  customs?: Record<
    string,
    {
      name: string;
      character?: string;
      imageUrl?: string | null;
      category?: string;
      line?: string;
      scale?: string;
    }
  >;
};

async function upsertShare(args: {
  userId: string;
  kind: "item" | "collection";
  sourceId: string;
  title: string;
  payload: unknown;
}): Promise<PublicShareResult> {
  const raw = JSON.stringify(args.payload);
  if (raw.length > MAX_PAYLOAD_CHARS) {
    throw new Error(
      "Share is too large. Remove some collection photos and try again.",
    );
  }

  const sql = await getSql();
  const existing = await sql.query<{ token: string }>(
    `select token from public_shares
     where user_id = $1 and kind = $2 and source_id = $3 and revoked_at is null
     order by updated_at desc
     limit 1`,
    [args.userId, args.kind, args.sourceId],
  );
  const token = existing[0]?.token ?? newToken();

  const rows = await sql.query<{
    token: string;
    title: string;
    updated_at: string;
  }>(
    `insert into public_shares
       (token, user_id, kind, source_id, title, payload, created_at, updated_at, revoked_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, now(), now(), null)
     on conflict (token) do update
       set title = excluded.title,
           payload = excluded.payload,
           source_id = excluded.source_id,
           updated_at = now(),
           revoked_at = null
     returning token, title, updated_at::text as updated_at`,
    [token, args.userId, args.kind, args.sourceId, args.title, raw],
  );

  const row = rows[0]!;
  return {
    token: row.token,
    kind: args.kind,
    title: row.title,
    path: pathFor(args.kind, row.token),
    updatedAt: row.updated_at ?? null,
  };
}

/** Publish or refresh a single vault item share. */
export const publishItemShare = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: ItemPublishInput) => {
    if (!data?.productId || typeof data.productId !== "string") {
      throw new Error("productId required");
    }
    return {
      productId: data.productId.slice(0, 200),
      custom: data.custom,
    };
  })
  .handler(async ({ context, data }): Promise<PublicShareResult> => {
    const covers = await loadSystemCovers([data.productId]);
    let payload = figureFromCatalog(data.productId, covers[data.productId]);
    if (!payload) {
      const c = data.custom;
      if (!c?.name?.trim()) {
        throw new Error("Figure not found in catalog.");
      }
      payload = {
        id: data.productId,
        name: c.name.trim().slice(0, 200),
        character: (c.character ?? c.name).trim().slice(0, 200),
        imageUrl: c.imageUrl ?? null,
        category: c.category ?? "7-inch",
        line: c.line ?? "Custom",
        scale: c.scale ?? '7"',
        description: c.description?.slice(0, 600),
        accessories: (c.accessories ?? []).slice(0, 12),
        isCustom: true,
      };
    }

    return upsertShare({
      userId: context.userId,
      kind: "item",
      sourceId: data.productId,
      title: payload.name,
      payload,
    });
  });

/** Publish or refresh a collection share. */
export const publishCollectionShare = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CollectionPublishInput) => {
    if (!data?.collectionId || typeof data.collectionId !== "string") {
      throw new Error("collectionId required");
    }
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      throw new Error("Collection name required");
    }
    const photos = Array.isArray(data.photos)
      ? data.photos.filter((p): p is string => typeof p === "string").slice(0, 8)
      : [];
    const productIds = Array.isArray(data.productIds)
      ? data.productIds
          .filter((id): id is string => typeof id === "string")
          .slice(0, 80)
      : [];
    return {
      collectionId: data.collectionId.slice(0, 120),
      name: data.name.trim().slice(0, 120),
      description:
        typeof data.description === "string"
          ? data.description.trim().slice(0, 500)
          : "",
      theme:
        typeof data.theme === "string" ? data.theme.trim().slice(0, 80) : "",
      photos,
      productIds,
      customs:
        data.customs && typeof data.customs === "object" ? data.customs : {},
    };
  })
  .handler(async ({ context, data }): Promise<PublicShareResult> => {
    const covers = await loadSystemCovers(data.productIds);
    const figures: SharedFigureCard[] = [];
    for (const id of data.productIds) {
      const fromCat = figureFromCatalog(id, covers[id]);
      if (fromCat) {
        figures.push({
          id: fromCat.id,
          name: fromCat.name,
          character: fromCat.character,
          imageUrl: fromCat.imageUrl,
          category: fromCat.category,
          line: fromCat.line,
          scale: fromCat.scale,
        });
        continue;
      }
      const c = data.customs[id];
      if (c?.name) {
        figures.push({
          id,
          name: c.name.trim().slice(0, 200),
          character: (c.character ?? c.name).trim().slice(0, 200),
          imageUrl: c.imageUrl ?? null,
          category: c.category ?? "7-inch",
          line: c.line ?? "Custom",
          scale: c.scale ?? '7"',
        });
      }
    }

    let photos = data.photos;
    let payload: SharedCollectionPayload = {
      name: data.name,
      description: data.description,
      theme: data.theme,
      photos,
      figures,
    };

    // Trim photos until payload fits
    while (
      JSON.stringify(payload).length > MAX_PAYLOAD_CHARS &&
      photos.length > 0
    ) {
      photos = photos.slice(0, -1);
      payload = { ...payload, photos };
    }
    if (JSON.stringify(payload).length > MAX_PAYLOAD_CHARS) {
      payload = { ...payload, photos: [] };
    }

    return upsertShare({
      userId: context.userId,
      kind: "collection",
      sourceId: data.collectionId,
      title: data.name,
      payload,
    });
  });

export const revokePublicShare = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { kind: "item" | "collection"; sourceId: string }) => {
    if (data?.kind !== "item" && data?.kind !== "collection") {
      throw new Error("Invalid share kind");
    }
    if (!data.sourceId || typeof data.sourceId !== "string") {
      throw new Error("sourceId required");
    }
    return { kind: data.kind, sourceId: data.sourceId.slice(0, 200) };
  })
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql.query(
      `update public_shares
       set revoked_at = now(), updated_at = now()
       where user_id = $1 and kind = $2 and source_id = $3 and revoked_at is null`,
      [context.userId, data.kind, data.sourceId],
    );
    return { ok: true };
  });

export const fetchPublicShare = createServerFn({ method: "GET" })
  .validator((data: { token: string; kind: "item" | "collection" }) => {
    const token = typeof data?.token === "string" ? data.token.trim() : "";
    if (!token || token.length < 8 || token.length > 80) {
      throw new Error("Invalid share link");
    }
    if (!/^[A-Za-z0-9_-]+$/.test(token)) {
      throw new Error("Invalid share link");
    }
    if (data.kind !== "item" && data.kind !== "collection") {
      throw new Error("Invalid share kind");
    }
    return { token, kind: data.kind as "item" | "collection" };
  })
  .handler(
    async ({
      data,
    }): Promise<{
      title: string;
      kind: "item" | "collection";
      payload: SharedItemPayload | SharedCollectionPayload;
      updatedAt: string | null;
    }> => {
      const sql = await getSql();
      const rows = await sql.query<{
        title: string;
        kind: string;
        payload: unknown;
        updated_at: string;
        revoked_at: string | null;
      }>(
        `select title, kind, payload, updated_at::text as updated_at,
                revoked_at::text as revoked_at
         from public_shares
         where token = $1 and kind = $2
         limit 1`,
        [data.token, data.kind],
      );
      const row = rows[0];
      if (!row || row.revoked_at) {
        throw new Error("This share link is unavailable.");
      }
      return {
        title: row.title,
        kind: row.kind as "item" | "collection",
        payload: (row.payload ?? {}) as SharedItemPayload | SharedCollectionPayload,
        updatedAt: row.updated_at ?? null,
      };
    },
  );
