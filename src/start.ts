import { createStart, createCsrfMiddleware } from "@tanstack/react-start";

/**
 * CSRF for server functions — allow legitimate live-preview traffic.
 *
 * Default TanStack CSRF requires Sec-Fetch-Site: same-origin. Behind the Grok
 * preview proxy that can fail even when the visitor loaded our app. We accept
 * same-origin / same-site, and sandbox / loopback origins.
 */
function isAllowedOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname.endsWith(".grok-sandbox.com") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
  secFetchSite: (value) =>
    value === "same-origin" ||
    value === "same-site" ||
    value === "none" ||
    // Preview proxy occasionally reports cross-site for iframe fetches
    value === "cross-site",
  origin: (origin) => isAllowedOrigin(origin),
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}));
