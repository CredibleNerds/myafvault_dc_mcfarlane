import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const getInstallGuideStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ seen: boolean }> => {
    const sql = await getSql();
    const rows = await sql.query<{ seen_install_guide: boolean }>(
      `select seen_install_guide from user_profiles where user_id = $1 limit 1`,
      [context.userId],
    );
    return { seen: !!rows[0]?.seen_install_guide };
  });

export const markInstallGuideSeen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ seen: boolean }> => {
    const sql = await getSql();
    await sql.query(
      `insert into user_profiles (user_id, seen_install_guide, updated_at)
       values ($1, true, now())
       on conflict (user_id) do update
         set seen_install_guide = true, updated_at = now()`,
      [context.userId],
    );
    return { seen: true };
  });
