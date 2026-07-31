import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createMiddleware } from "@tanstack/react-start";
import { isAdminEmail } from "@/lib/admin";

export type SystemImageMap = Record<string, string>;

/** Auth + admin gate for mutations. */
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

    // Dev mode (auth off): allow
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

/** Whether the signed-in user can manage vault-wide settings. */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; email: string | null }> => {
    const { getSessionUser, authConfigured } = await import(
      "@/lib/auth/verify.server"
    );
    if (!authConfigured) {
      return { isAdmin: true, email: "dev@example.com" };
    }
    const user = await getSessionUser(context.bearerToken as string | undefined);
    const email = user?.email ?? null;
    return { isAdmin: isAdminEmail(email), email };
  });

/** All signed-in users can load system covers (needed for catalogue display). */
export const fetchSystemImages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<SystemImageMap> => {
    const sql = await getSql();
    try {
      const rows = await sql.query<{ product_id: string; image_url: string }>(
        `select product_id, image_url from system_product_images`,
      );
      const map: SystemImageMap = {};
      for (const row of rows) {
        if (row.product_id && row.image_url) {
          map[row.product_id] = row.image_url;
        }
      }
      return map;
    } catch (err) {
      // Table may not exist yet on a brand-new DB mid-migrate
      console.warn("[system-images] fetch failed", err);
      return {};
    }
  });

/** Admin: set or replace the system-wide cover for a product. */
export const setSystemProductImage = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: { productId: string; imageUrl: string }) => {
    if (!data?.productId || typeof data.productId !== "string") {
      throw new Error("productId required");
    }
    if (!data?.imageUrl || typeof data.imageUrl !== "string") {
      throw new Error("imageUrl required");
    }
    if (data.imageUrl.length > 6_000_000) {
      throw new Error("Image is too large. Use a smaller photo.");
    }
    return {
      productId: data.productId.trim(),
      imageUrl: data.imageUrl,
    };
  })
  .handler(async ({ context, data }): Promise<{ productId: string; imageUrl: string }> => {
    const sql = await getSql();
    await sql.query(
      `insert into system_product_images (product_id, image_url, updated_by, updated_at)
       values ($1, $2, $3, now())
       on conflict (product_id) do update
         set image_url = excluded.image_url,
             updated_by = excluded.updated_by,
             updated_at = now()`,
      [data.productId, data.imageUrl, context.userId],
    );
    return { productId: data.productId, imageUrl: data.imageUrl };
  });

/** Admin: clear system cover → fall back to catalog pack shot. */
export const clearSystemProductImage = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: { productId: string }) => {
    if (!data?.productId || typeof data.productId !== "string") {
      throw new Error("productId required");
    }
    return { productId: data.productId.trim() };
  })
  .handler(async ({ data }): Promise<{ productId: string }> => {
    const sql = await getSql();
    await sql.query(`delete from system_product_images where product_id = $1`, [
      data.productId,
    ]);
    return { productId: data.productId };
  });
