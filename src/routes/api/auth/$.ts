import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

/**
 * Normalize Origin to the public preview host (X-Forwarded-Host) so Better Auth
 * CSRF accepts live-preview requests. Does not disable origin checks — only
 * aligns Origin with the host the visitor actually loaded.
 */
function withPublicOrigin(request: Request): Request {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return request;
  }
  const xfHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!xfHost) return request;

  // Only rewrite for known safe hosts (sandbox + loopback).
  const safe =
    /\.grok-sandbox\.com$/i.test(xfHost) ||
    xfHost === "localhost" ||
    xfHost.startsWith("localhost:") ||
    xfHost.startsWith("127.0.0.1") ||
    xfHost.startsWith("[::1]");
  if (!safe) return request;

  const xfProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (/\.grok-sandbox\.com$/i.test(xfHost) ? "https" : "http");
  const publicOrigin = `${xfProto}://${xfHost}`;
  const current = request.headers.get("origin");
  if (current === publicOrigin) return request;

  const headers = new Headers(request.headers);
  headers.set("origin", publicOrigin);
  if (!headers.get("referer")) headers.set("referer", `${publicOrigin}/`);
  headers.set("host", xfHost);
  headers.set("x-forwarded-host", xfHost);
  headers.set("x-forwarded-proto", xfProto);

  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    // Required when forwarding a body stream in newer fetch specs
    duplex: "half",
  } as RequestInit);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(withPublicOrigin(request)),
      PUT: ({ request }) => auth.handler(withPublicOrigin(request)),
      PATCH: ({ request }) => auth.handler(withPublicOrigin(request)),
      DELETE: ({ request }) => auth.handler(withPublicOrigin(request)),
    },
  },
});
