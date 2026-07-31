import { createHash, randomBytes } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import * as OTPAuth from "otpauth";
import { getSql } from "@/lib/db";
import { auth } from "@/lib/auth/server";

const ISSUER = "McFarlane Vault";
const UNLOCK_DAYS = 14;

export type SessionContext = {
  userId: string;
  email: string | null;
  name: string | null;
  sessionKey: string;
};

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    codes.push(randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

function makeTotp(secretBase32: string, label: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: label || "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

/** Resolve current Better Auth session (cookie or bearer). */
export async function resolveAuthSession(
  bearerToken?: string,
): Promise<SessionContext | null> {
  const request = getRequest();
  if (!request) return null;
  let headers = request.headers;
  if (bearerToken) {
    headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id || !session.session) return null;
  const s = session.session as { token?: string; id?: string };
  const rawKey = s.token || s.id || session.user.id;
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    sessionKey: hashKey(String(rawKey)),
  };
}

export async function getTwoFactorRow(userId: string) {
  const sql = await getSql();
  const rows = await sql.query<{
    totp_secret: string;
    enabled: boolean;
    backup_codes: unknown;
  }>(
    `select totp_secret, enabled, backup_codes
     from two_factor_settings
     where user_id = $1
     limit 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function isSessionUnlocked(
  userId: string,
  sessionKey: string,
): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ ok: number }>(
    `select 1 as ok from two_factor_unlocks
     where user_id = $1 and session_key = $2 and expires_at > now()
     limit 1`,
    [userId, sessionKey],
  );
  return rows.length > 0;
}

export async function unlockSession(
  userId: string,
  sessionKey: string,
): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `insert into two_factor_unlocks (user_id, session_key, expires_at)
     values ($1, $2, now() + ($3::text || ' days')::interval)
     on conflict (user_id, session_key) do update
       set expires_at = excluded.expires_at`,
    [userId, sessionKey, String(UNLOCK_DAYS)],
  );
}

export async function clearUnlocks(userId: string): Promise<void> {
  const sql = await getSql();
  await sql.query(`delete from two_factor_unlocks where user_id = $1`, [
    userId,
  ]);
}

export function verifyTotpCode(
  secretBase32: string,
  code: string,
  label = "user",
): boolean {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const totp = makeTotp(secretBase32, label);
  const delta = totp.validate({ token: cleaned, window: 1 });
  return delta !== null;
}

export function verifyBackupCode(
  stored: unknown,
  code: string,
): { ok: boolean; remaining: string[] } {
  const list = Array.isArray(stored)
    ? stored.map((c) => String(c).toUpperCase())
    : [];
  const target = code.replace(/\s+/g, "").toUpperCase();
  const idx = list.indexOf(target);
  if (idx < 0) return { ok: false, remaining: list };
  const remaining = list.filter((_, i) => i !== idx);
  return { ok: true, remaining };
}

export async function beginSetupSecret(
  userId: string,
  email: string | null,
  name: string | null,
) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const base32 = secret.base32;
  const label = email || name || userId;
  const totp = makeTotp(base32, label);
  const uri = totp.toString();

  const sql = await getSql();
  await sql.query(
    `insert into two_factor_settings (user_id, totp_secret, enabled, backup_codes, updated_at)
     values ($1, $2, false, '[]'::jsonb, now())
     on conflict (user_id) do update
       set totp_secret = excluded.totp_secret,
           enabled = false,
           backup_codes = '[]'::jsonb,
           updated_at = now()`,
    [userId, base32],
  );

  return { secret: base32, uri, label };
}

export async function enableTwoFactor(
  userId: string,
  secret: string,
  backupCodes: string[],
) {
  const sql = await getSql();
  await sql.query(
    `update two_factor_settings
     set enabled = true,
         totp_secret = $2,
         backup_codes = $3::jsonb,
         updated_at = now()
     where user_id = $1`,
    [userId, secret, JSON.stringify(backupCodes)],
  );
}

export async function disableTwoFactor(userId: string) {
  const sql = await getSql();
  await sql.query(`delete from two_factor_settings where user_id = $1`, [
    userId,
  ]);
  await clearUnlocks(userId);
}

export async function updateBackupCodes(userId: string, codes: string[]) {
  const sql = await getSql();
  await sql.query(
    `update two_factor_settings
     set backup_codes = $2::jsonb, updated_at = now()
     where user_id = $1`,
    [userId, JSON.stringify(codes)],
  );
}

export { generateBackupCodes, makeTotp, ISSUER };
