import { getRequest } from "@tanstack/react-start/server";
import { auth, authConfigured } from "./server";

/**
 * Server-side session resolution (server-only).
 *
 * Because this app runs its OWN Better Auth at same-origin `/api/auth/*`, the
 * session cookie is sent with every request to this app — server functions AND
 * SSR loaders included. So we resolve the user straight from the request cookies
 * via `auth.api.getSession` (no client-minted JWT needed). Never trust a
 * client-supplied user id — only the result of this verification.
 */

/** True when a real database is configured server-side. */
const databaseConfigured = Boolean(
  process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim(),
);

/** Re-export so callers can branch on it without importing `server.ts`. */
export { authConfigured };

if (databaseConfigured && !authConfigured) {
  console.error(
    "[auth] Postgres URL is set but auth is disabled (VITE_AUTH_ENABLED=false) " +
      "— requireUserId() will reject every request (fail closed) rather than " +
      "share one dev user on a real database.",
  );
}

/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */
export const DEV_USER_ID = "dev-user";

/**
 * Thrown by `requireUserId` when the caller has no valid session. Carries
 * `status: 401`; the message is a stable contract — match
 * `err.message === "Unauthorized"` client-side to send the visitor to sign-in.
 */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Resolve the authenticated user id from the request session.
 *
 * - Auth configured -> require a valid session; throw UnauthorizedError if none
 * - Auth disabled (`VITE_AUTH_ENABLED=false`) + no Postgres URL -> DEV_USER_ID
 * - Auth disabled + Postgres URL set -> throw (fail closed)
 */
export async function requireUserId(): Promise<string> {
  if (!authConfigured) {
    if (databaseConfigured) {
      throw new Error(
        "Auth is disabled (VITE_AUTH_ENABLED=false) but a Postgres URL is set — " +
          "refusing to share the dev user on a real database. Enable auth or " +
          "unset DATABASE_URL / POSTGRES_URL.",
      );
    }
    return DEV_USER_ID;
  }

  const request = getRequest();
  if (!request) throw new UnauthorizedError();

  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) throw new UnauthorizedError();
  return userId;
}

/**
 * Soft session lookup — returns null when signed out (does not throw).
 * Prefer `requireUserId` for mutations that must be authenticated.
 */
export async function getOptionalUserId(): Promise<string | null> {
  if (!authConfigured) {
    return databaseConfigured ? null : DEV_USER_ID;
  }
  try {
    const request = getRequest();
    if (!request) return null;
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
