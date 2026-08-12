import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type ForumKind = "photo" | "collection" | "question";

export type ForumComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type ForumPost = {
  id: string;
  authorId: string;
  authorName: string;
  kind: ForumKind;
  title: string;
  body: string;
  imageData: string | null;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  mine: boolean;
  comments: ForumComment[];
};

function newId(): string {
  return randomBytes(12).toString("hex");
}

function asKind(value: unknown): ForumKind {
  return value === "question" || value === "collection" ? value : "photo";
}

function clamp(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

async function requireMember(userId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ user_id: string }>(
    `select user_id from forum_members where user_id = $1 limit 1`,
    [userId],
  );
  if (!rows[0]) throw new Error("Join the collector board first.");
}

export const getForumMembership = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ joined: boolean }> => {
    const sql = await getSql();
    const rows = await sql.query<{ user_id: string }>(
      `select user_id from forum_members where user_id = $1 limit 1`,
      [context.userId],
    );
    return { joined: !!rows[0] };
  });

export const joinForum = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ joined: boolean }> => {
    const sql = await getSql();
    await sql.query(
      `insert into forum_members (user_id, joined_at)
       values ($1, now()) on conflict (user_id) do nothing`,
      [context.userId],
    );
    return { joined: true };
  });

export const leaveForum = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ joined: boolean }> => {
    const sql = await getSql();
    await sql.query(`delete from forum_members where user_id = $1`, [
      context.userId,
    ]);
    return { joined: false };
  });

export const listForumPosts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ForumPost[]> => {
    await requireMember(context.userId);
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      user_id: string;
      kind: string;
      title: string;
      body: string;
      image_data: string | null;
      created_at: string;
      author_name: string | null;
    }>(
      `select p.id, p.user_id, p.kind, p.title, p.body, p.image_data,
              p.created_at::text as created_at,
              coalesce(nullif(pr.display_name, ''), nullif(u.name, ''), 'Collector') as author_name
       from forum_posts p
       left join user_profiles pr on pr.user_id = p.user_id
       left join "user" u on u.id = p.user_id
       order by p.created_at desc
       limit 40`,
    );
    const ids = rows.map((r) => r.id);
    const likeMap = new Map<string, { n: number; mine: boolean }>();
    const commentsByPost = new Map<string, ForumComment[]>();
    if (ids.length > 0) {
      const likes = await sql.query<{
        post_id: string;
        n: number;
        mine: boolean;
      }>(
        `select post_id, count(*)::int as n,
                bool_or(user_id = $2) as mine
         from forum_likes
         where post_id = any($1::text[])
         group by post_id`,
        [ids, context.userId],
      );
      for (const row of likes) {
        likeMap.set(row.post_id, { n: Number(row.n) || 0, mine: !!row.mine });
      }
      const comments = await sql.query<{
        id: string;
        post_id: string;
        user_id: string;
        body: string;
        created_at: string;
        author_name: string | null;
      }>(
        `select c.id, c.post_id, c.user_id, c.body,
                c.created_at::text as created_at,
                coalesce(nullif(pr.display_name, ''), nullif(u.name, ''), 'Collector') as author_name
         from forum_comments c
         left join user_profiles pr on pr.user_id = c.user_id
         left join "user" u on u.id = c.user_id
         where c.post_id = any($1::text[])
         order by c.created_at asc`,
        [ids],
      );
      for (const row of comments) {
        const list = commentsByPost.get(row.post_id) ?? [];
        list.push({
          id: row.id,
          postId: row.post_id,
          authorId: row.user_id,
          authorName: row.author_name || "Collector",
          body: row.body,
          createdAt: row.created_at,
          mine: row.user_id === context.userId,
        });
        commentsByPost.set(row.post_id, list);
      }
    }
    return rows.map((row) => {
      const likes = likeMap.get(row.id);
      return {
        id: row.id,
        authorId: row.user_id,
        authorName: row.author_name || "Collector",
        kind: asKind(row.kind),
        title: row.title,
        body: row.body,
        imageData: row.image_data,
        createdAt: row.created_at,
        likeCount: likes?.n ?? 0,
        likedByMe: likes?.mine ?? false,
        mine: row.user_id === context.userId,
        comments: commentsByPost.get(row.id) ?? [],
      };
    });
  });

export const createForumPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: {
    kind?: ForumKind;
    title?: string;
    body?: string;
    imageData?: string | null;
  }) => {
    const title = clamp(data.title, 80);
    const body = clamp(data.body, 800);
    const kind = asKind(data.kind);
    let imageData =
      typeof data.imageData === "string" && data.imageData.startsWith("data:image/")
        ? data.imageData
        : null;
    if (imageData && imageData.length > 450_000) {
      throw new Error("Photo is too large. Try a smaller image.");
    }
    if (!title) throw new Error("Add a short title.");
    if (kind !== "question" && !imageData && !body) {
      throw new Error("Add a photo or a few words.");
    }
    if (kind === "question" && !body) {
      throw new Error("Write your question.");
    }
    return { kind, title, body, imageData };
  })
  .handler(async ({ context, data }): Promise<ForumPost> => {
    await requireMember(context.userId);
    const sql = await getSql();
    const id = newId();
    await sql.query(
      `insert into forum_posts (id, user_id, kind, title, body, image_data, created_at)
       values ($1,$2,$3,$4,$5,$6, now())`,
      [id, context.userId, data.kind, data.title, data.body, data.imageData],
    );
    return {
      id,
      authorId: context.userId,
      authorName: "You",
      kind: data.kind,
      title: data.title,
      body: data.body,
      imageData: data.imageData,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      likedByMe: false,
      mine: true,
      comments: [],
    };
  });

export const addForumComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { postId?: string; body?: string }) => {
    const postId = clamp(data.postId, 40);
    const body = clamp(data.body, 400);
    if (!postId) throw new Error("Missing post.");
    if (!body) throw new Error("Write a comment.");
    return { postId, body };
  })
  .handler(async ({ context, data }): Promise<ForumComment> => {
    await requireMember(context.userId);
    const sql = await getSql();
    const exists = await sql.query<{ id: string }>(
      `select id from forum_posts where id = $1 limit 1`,
      [data.postId],
    );
    if (!exists[0]) throw new Error("That post is gone.");
    const id = newId();
    await sql.query(
      `insert into forum_comments (id, post_id, user_id, body, created_at)
       values ($1,$2,$3,$4, now())`,
      [id, data.postId, context.userId, data.body],
    );
    return {
      id,
      postId: data.postId,
      authorId: context.userId,
      authorName: "You",
      body: data.body,
      createdAt: new Date().toISOString(),
      mine: true,
    };
  });

export const toggleForumLike = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { postId?: string }) => {
    const postId = clamp(data.postId, 40);
    if (!postId) throw new Error("Missing post.");
    return { postId };
  })
  .handler(
    async ({
      context,
      data,
    }): Promise<{ liked: boolean; likeCount: number }> => {
      await requireMember(context.userId);
      const sql = await getSql();
      const existing = await sql.query<{ post_id: string }>(
        `select post_id from forum_likes where post_id = $1 and user_id = $2 limit 1`,
        [data.postId, context.userId],
      );
      if (existing[0]) {
        await sql.query(
          `delete from forum_likes where post_id = $1 and user_id = $2`,
          [data.postId, context.userId],
        );
      } else {
        await sql.query(
          `insert into forum_likes (post_id, user_id, created_at)
           values ($1,$2, now()) on conflict do nothing`,
          [data.postId, context.userId],
        );
      }
      const counts = await sql.query<{ n: number }>(
        `select count(*)::int as n from forum_likes where post_id = $1`,
        [data.postId],
      );
      return {
        liked: !existing[0],
        likeCount: Number(counts[0]?.n ?? 0),
      };
    },
  );

export const deleteForumPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { postId?: string }) => {
    const postId = clamp(data.postId, 40);
    if (!postId) throw new Error("Missing post.");
    return { postId };
  })
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const result = await sql.query(
      `delete from forum_posts where id = $1 and user_id = $2`,
      [data.postId, context.userId],
    );
    void result;
    return { ok: true };
  });
