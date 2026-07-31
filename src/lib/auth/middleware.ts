import { createMiddleware } from "@tanstack/react-start";

/**
 * Auth middleware for server functions — the standard way to get the caller's
 * verified user id. When deployed the session cookie is same-origin and rides
 * along automatically. In the live preview the client also forwards the bearer
 * token (partitioned cookies) via the `.client` hook below — call sites do not
 * thread it themselves.
 *
 * Signed out (auth on — the default, including live preview) -> throws
 * `UnauthorizedError`. Only when auth is explicitly disabled
 * (`VITE_AUTH_ENABLED=false`) does it resolve the shared dev user.
 */
export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("./client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("./isolation.server");
    const { requireUserId } = await import("./verify.server");
    assertSameSiteRequest();
    const bearerToken = context.bearerToken as string | undefined;
    const userId = await requireUserId(bearerToken);
    return next({ context: { userId, bearerToken } });
  });
