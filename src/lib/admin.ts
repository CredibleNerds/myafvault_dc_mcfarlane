/**
 * Admin allowlist for vault-wide settings (system product covers, etc.).
 *
 * Set either:
 *   ADMIN_EMAILS=you@example.com,other@example.com
 *   VITE_ADMIN_EMAILS=...   (same list — exposed to client for UI chrome only)
 *
 * Server-side checks always use ADMIN_EMAILS || VITE_ADMIN_EMAILS.
 * When auth is disabled (dev), the dev user is treated as admin.
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Server-side env list (preferred). */
export function adminEmailsFromEnv(): string[] {
  if (typeof process !== "undefined") {
    const list = parseList(
      process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS,
    );
    if (list.length) return list;
  }
  try {
    // Vite client bundle
    return parseList(
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_ADMIN_EMAILS,
    );
  } catch {
    return [];
  }
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = adminEmailsFromEnv();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

/** Client helper — true when signed-in email is on the allowlist. */
export function isClientAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = parseList(
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_ADMIN_EMAILS,
  );
  // Also accept runtime injection via window for flexibility (optional)
  if (typeof window !== "undefined") {
    const w = (window as unknown as { __ADMIN_EMAILS__?: string }).__ADMIN_EMAILS__;
    if (w) list.push(...parseList(w));
  }
  if (list.length === 0) {
    // Dev fallback: auth disabled → treat any non-null email as potential admin
    // so local preview can manage covers. Production must set VITE_ADMIN_EMAILS.
    const authOff =
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_AUTH_ENABLED === "false";
    return authOff;
  }
  return list.includes(email.trim().toLowerCase());
}
