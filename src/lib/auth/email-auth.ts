import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { dbSource, getSql } from "@/lib/db";

/**
 * Email sign-up / sign-in without Better Auth's HTTP origin middleware.
 *
 * Production (Vercel) requires a Postgres URL (`DATABASE_URL` or the Supabase
 * integration's `POSTGRES_URL`). PGLite is preview-only.
 */

function newId(): string {
  return randomBytes(16).toString("hex");
}

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

function productionDbRequiredMessage(): string | null {
  if (process.env.VERCEL === "1" && dbSource !== "neon") {
    return (
      "Cloud database is not configured. Connect Supabase (or set DATABASE_URL) " +
      "in Vercel project settings for Production, then redeploy."
    );
  }
  return null;
}

function friendlyAuthError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : fallback;
  if (/ENOENT|pglite\.data|EROFS|read-only file system/i.test(message)) {
    return (
      "Cloud database is not configured for this deploy. " +
      "Set DATABASE_URL or POSTGRES_URL in Vercel and redeploy."
    );
  }
  if (/invalid origin/i.test(message)) {
    return "Sign-in blocked by a security check. Refresh the page and try again.";
  }
  if (
    /user already exists|already registered|EMAIL_ALREADY|unique|duplicate/i.test(
      message,
    )
  ) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (/invalid email or password|INVALID_EMAIL_OR_PASSWORD/i.test(message)) {
    return "Invalid email or password";
  }
  if (/relation .* does not exist|undefined_table/i.test(message)) {
    return (
      "Database tables are missing. Ensure the Postgres URL is set and " +
      "migrations have run, then redeploy."
    );
  }
  return message || fallback;
}

export type EmailAuthResult =
  | {
      ok: true;
      user: { id: string; email: string; name: string | null };
      token: string | null;
    }
  | { ok: false; message: string };

async function createSession(userId: string): Promise<string> {
  const sql = await getSql();
  const token = newToken();
  const sessionId = newId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sql.query(
    `insert into "session" ("id", "expiresAt", "token", "createdAt", "updatedAt", "userId")
     values ($1, $2, $3, now(), now(), $4)`,
    [sessionId, expiresAt.toISOString(), token, userId],
  );
  return token;
}

export async function verifyUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ password: string | null }>(
    `select "password" from "account"
     where "userId" = $1 and "providerId" = 'credential'
     limit 1`,
    [userId],
  );
  const hash = rows[0]?.password;
  if (!hash || !password) return false;
  return verifyPassword({ hash, password });
}

export const signUpWithEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string; name: string }) => {
    const email = String(data?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(data?.password ?? "");
    const name = String(data?.name ?? "").trim();
    if (!email || !password) throw new Error("Email and password are required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address");
    }
    if (password.length < 8)
      throw new Error("Password must be at least 8 characters");
    if (!name) throw new Error("Please enter a display name");
    return { email, password, name };
  })
  .handler(async ({ data }): Promise<EmailAuthResult> => {
    const blocked = productionDbRequiredMessage();
    if (blocked) return { ok: false, message: blocked };
    try {
      const sql = await getSql();
      const existing = await sql.query<{ id: string }>(
        `select "id" from "user" where lower("email") = $1 limit 1`,
        [data.email],
      );
      if (existing.length > 0) {
        return {
          ok: false,
          message: "An account with this email already exists. Sign in instead.",
        };
      }

      const userId = newId();
      const accountId = newId();
      const passwordHash = await hashPassword(data.password);

      await sql.query(
        `insert into "user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
         values ($1, $2, $3, false, null, now(), now())`,
        [userId, data.name, data.email],
      );
      await sql.query(
        `insert into "account" (
           "id", "accountId", "providerId", "userId", "password",
           "createdAt", "updatedAt"
         ) values ($1, $2, 'credential', $3, $4, now(), now())`,
        [accountId, userId, userId, passwordHash],
      );

      const token = await createSession(userId);
      return {
        ok: true,
        token,
        user: { id: userId, email: data.email, name: data.name },
      };
    } catch (err) {
      return {
        ok: false,
        message: friendlyAuthError(err, "Could not create account"),
      };
    }
  });

export const signInWithEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => {
    const email = String(data?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(data?.password ?? "");
    if (!email || !password) throw new Error("Email and password are required");
    return { email, password };
  })
  .handler(async ({ data }): Promise<EmailAuthResult> => {
    const blocked = productionDbRequiredMessage();
    if (blocked) return { ok: false, message: blocked };
    try {
      const sql = await getSql();
      const users = await sql.query<{
        id: string;
        email: string;
        name: string | null;
        password: string | null;
      }>(
        `select u."id", u."email", u."name", a."password"
         from "user" u
         join "account" a on a."userId" = u."id" and a."providerId" = 'credential'
         where lower(u."email") = $1
         limit 1`,
        [data.email],
      );
      const row = users[0];
      if (!row?.password) {
        return { ok: false, message: "Invalid email or password" };
      }
      const valid = await verifyPassword({
        hash: row.password,
        password: data.password,
      });
      if (!valid) {
        return { ok: false, message: "Invalid email or password" };
      }

      const token = await createSession(row.id);
      return {
        ok: true,
        token,
        user: {
          id: row.id,
          email: row.email,
          name: row.name,
        },
      };
    } catch (err) {
      return {
        ok: false,
        message: friendlyAuthError(err, "Invalid email or password"),
      };
    }
  });
