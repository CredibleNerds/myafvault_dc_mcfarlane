import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  DEFAULT_AVATAR,
  parseAvatarConfig,
  type AvatarConfig,
} from "@/lib/avatar";

export type AvatarKind = "none" | "upload" | "figure" | "custom";

export type UserProfile = {
  displayName: string;
  bio: string;
  location: string;
  collectorSince: number | null;
  avatarKind: AvatarKind;
  avatarData: string | null;
  avatarProductId: string | null;
  avatarConfig: AvatarConfig;
  favoriteProductIds: string[];
  favoriteLines: string[];
  favoriteCollectionIds: string[];
  email: string | null;
  updatedAt: string | null;
};

export const emptyProfile = (email: string | null = null): UserProfile => ({
  displayName: "",
  bio: "",
  location: "",
  collectorSince: null,
  avatarKind: "none",
  avatarData: null,
  avatarProductId: null,
  avatarConfig: { ...DEFAULT_AVATAR },
  favoriteProductIds: [],
  favoriteLines: [],
  favoriteCollectionIds: [],
  email,
  updatedAt: null,
});

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
}

function asKind(value: unknown): AvatarKind {
  return value === "upload" ||
    value === "figure" ||
    value === "custom"
    ? value
    : "none";
}

function clampText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<UserProfile> => {
    const sql = await getSql();
    const users = await sql.query<{ name: string; email: string }>(
      `select name, email from "user" where id = $1 limit 1`,
      [context.userId],
    );
    const authUser = users[0];
    const rows = await sql.query<{
      display_name: string | null;
      bio: string | null;
      location: string | null;
      collector_since: number | null;
      avatar_kind: string;
      avatar_data: string | null;
      avatar_product_id: string | null;
      avatar_config: unknown;
      favorite_product_ids: unknown;
      favorite_lines: unknown;
      favorite_collection_ids: unknown;
      updated_at: string;
    }>(
      `select display_name, bio, location, collector_since, avatar_kind,
              avatar_data, avatar_product_id,
              coalesce(avatar_config, '{}'::jsonb) as avatar_config,
              favorite_product_ids, favorite_lines, favorite_collection_ids,
              updated_at::text as updated_at
       from user_profiles where user_id = $1 limit 1`,
      [context.userId],
    );
    const row = rows[0];
    const email = authUser?.email ?? null;
    if (!row) {
      return {
        ...emptyProfile(email),
        displayName: authUser?.name ?? "",
      };
    }
    const config = parseAvatarConfig(row.avatar_config);
    if (!config.productId && row.avatar_product_id) {
      config.productId = row.avatar_product_id;
      if (config.source === "initials" && row.avatar_kind === "figure") {
        config.source = "figure";
      }
    }
    return {
      displayName: row.display_name || authUser?.name || "",
      bio: row.bio ?? "",
      location: row.location ?? "",
      collectorSince: row.collector_since,
      avatarKind: asKind(row.avatar_kind),
      avatarData: row.avatar_data,
      avatarProductId: row.avatar_product_id,
      avatarConfig: config,
      favoriteProductIds: asStringArray(row.favorite_product_ids).slice(0, 8),
      favoriteLines: asStringArray(row.favorite_lines).slice(0, 12),
      favoriteCollectionIds: asStringArray(row.favorite_collection_ids).slice(
        0,
        8,
      ),
      email,
      updatedAt: row.updated_at ?? null,
    };
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: Partial<UserProfile>) => {
    const displayName = clampText(data.displayName, 40);
    const bio = clampText(data.bio, 180);
    const location = clampText(data.location, 40);
    const year =
      typeof data.collectorSince === "number" &&
      data.collectorSince >= 1980 &&
      data.collectorSince <= new Date().getFullYear()
        ? data.collectorSince
        : null;
    const avatarConfig = parseAvatarConfig(data.avatarConfig);
    let avatarKind: AvatarKind =
      data.avatarKind === "none" ? "none" : "custom";
    let avatarData =
      typeof data.avatarData === "string" ? data.avatarData : null;
    if (avatarData && avatarData.length > 450_000) {
      throw new Error("Profile photo is too large. Try a smaller image.");
    }
    if (avatarKind === "none") {
      avatarData = null;
      avatarConfig.source = "initials";
      avatarConfig.productId = null;
    } else if (avatarConfig.source !== "upload") {
      avatarData = null;
    }
    const avatarProductId =
      avatarConfig.source === "figure" ? avatarConfig.productId : null;

    return {
      displayName,
      bio,
      location,
      collectorSince: year,
      avatarKind,
      avatarData,
      avatarProductId,
      avatarConfig,
      favoriteProductIds: asStringArray(data.favoriteProductIds).slice(0, 8),
      favoriteLines: asStringArray(data.favoriteLines).slice(0, 12),
      favoriteCollectionIds: asStringArray(data.favoriteCollectionIds).slice(
        0,
        8,
      ),
    };
  })
  .handler(async ({ context, data }): Promise<UserProfile> => {
    const sql = await getSql();
    if (data.displayName) {
      await sql.query(
        `update "user" set name = $2, "updatedAt" = now() where id = $1`,
        [context.userId, data.displayName],
      );
    }
    await sql.query(
      `insert into user_profiles (
         user_id, display_name, bio, location, collector_since,
         avatar_kind, avatar_data, avatar_product_id, avatar_config,
         favorite_product_ids, favorite_lines, favorite_collection_ids, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb, now())
       on conflict (user_id) do update set
         display_name = excluded.display_name,
         bio = excluded.bio,
         location = excluded.location,
         collector_since = excluded.collector_since,
         avatar_kind = excluded.avatar_kind,
         avatar_data = excluded.avatar_data,
         avatar_product_id = excluded.avatar_product_id,
         avatar_config = excluded.avatar_config,
         favorite_product_ids = excluded.favorite_product_ids,
         favorite_lines = excluded.favorite_lines,
         favorite_collection_ids = excluded.favorite_collection_ids,
         updated_at = now()`,
      [
        context.userId,
        data.displayName || null,
        data.bio || null,
        data.location || null,
        data.collectorSince,
        data.avatarKind,
        data.avatarData,
        data.avatarProductId,
        JSON.stringify(data.avatarConfig),
        JSON.stringify(data.favoriteProductIds),
        JSON.stringify(data.favoriteLines),
        JSON.stringify(data.favoriteCollectionIds),
      ],
    );
    const users = await sql.query<{ email: string }>(
      `select email from "user" where id = $1 limit 1`,
      [context.userId],
    );
    return {
      displayName: data.displayName,
      bio: data.bio,
      location: data.location,
      collectorSince: data.collectorSince,
      avatarKind: data.avatarKind,
      avatarData: data.avatarData,
      avatarProductId: data.avatarProductId,
      avatarConfig: data.avatarConfig,
      favoriteProductIds: data.favoriteProductIds,
      favoriteLines: data.favoriteLines,
      favoriteCollectionIds: data.favoriteCollectionIds,
      email: users[0]?.email ?? null,
      updatedAt: new Date().toISOString(),
    };
  });
