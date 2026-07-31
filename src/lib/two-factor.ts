import { createServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  beginSetupSecret,
  disableTwoFactor,
  enableTwoFactor,
  generateBackupCodes,
  getTwoFactorRow,
  isSessionUnlocked,
  resolveAuthSession,
  unlockSession,
  updateBackupCodes,
  verifyBackupCode,
  verifyTotpCode,
} from "@/lib/two-factor.server";

export type TwoFactorStatus = {
  enabled: boolean;
  unlocked: boolean;
  requiresChallenge: boolean;
};

/** Public status for the signed-in user (drives gate + security page). */
export const getTwoFactorStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<TwoFactorStatus> => {
    const session = await resolveAuthSession(context.bearerToken);
    if (!session || session.userId !== context.userId) {
      return { enabled: false, unlocked: true, requiresChallenge: false };
    }
    const row = await getTwoFactorRow(context.userId);
    if (!row?.enabled) {
      return { enabled: false, unlocked: true, requiresChallenge: false };
    }
    const unlocked = await isSessionUnlocked(
      context.userId,
      session.sessionKey,
    );
    return {
      enabled: true,
      unlocked,
      requiresChallenge: !unlocked,
    };
  });

/** Start setup: returns secret + otpauth URI + QR data URL (not enabled yet). */
export const startTwoFactorSetup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const session = await resolveAuthSession(context.bearerToken);
    if (!session) throw new Error("Unauthorized");
    const { secret, uri, label } = await beginSetupSecret(
      context.userId,
      session.email,
      session.name,
    );
    const qrDataUrl = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: "#0a0b0e", light: "#ffffff" },
    });
    return { secret, uri, label, qrDataUrl };
  });

/** Confirm setup with a live authenticator code → enables 2FA + backup codes. */
export const confirmTwoFactorSetup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code: string }) => {
    if (!data?.code?.trim()) throw new Error("Code required");
    return { code: data.code.trim() };
  })
  .handler(async ({ context, data }) => {
    const row = await getTwoFactorRow(context.userId);
    if (!row) throw new Error("Start setup first");
    if (!verifyTotpCode(row.totp_secret, data.code)) {
      throw new Error("Invalid authenticator code. Try again.");
    }
    const backupCodes = generateBackupCodes(8);
    await enableTwoFactor(context.userId, row.totp_secret, backupCodes);
    const session = await resolveAuthSession(context.bearerToken);
    if (session) await unlockSession(context.userId, session.sessionKey);
    return { backupCodes };
  });

/** Challenge after sign-in: TOTP or backup code. */
export const verifyTwoFactorChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code: string }) => {
    if (!data?.code?.trim()) throw new Error("Code required");
    return { code: data.code.trim() };
  })
  .handler(async ({ context, data }) => {
    const session = await resolveAuthSession(context.bearerToken);
    if (!session) throw new Error("Unauthorized");
    const row = await getTwoFactorRow(context.userId);
    if (!row?.enabled) {
      return { ok: true as const };
    }

    let ok = verifyTotpCode(row.totp_secret, data.code);
    if (!ok) {
      const backup = verifyBackupCode(row.backup_codes, data.code);
      if (backup.ok) {
        ok = true;
        await updateBackupCodes(context.userId, backup.remaining);
      }
    }
    if (!ok) throw new Error("Invalid code. Check your authenticator app.");

    await unlockSession(context.userId, session.sessionKey);
    return { ok: true as const };
  });

/** Disable 2FA (requires a current authenticator code). */
export const disableTwoFactorSetup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code: string }) => {
    if (!data?.code?.trim()) throw new Error("Code required");
    return { code: data.code.trim() };
  })
  .handler(async ({ context, data }) => {
    const row = await getTwoFactorRow(context.userId);
    if (!row?.enabled) return { ok: true as const };
    if (!verifyTotpCode(row.totp_secret, data.code)) {
      const backup = verifyBackupCode(row.backup_codes, data.code);
      if (!backup.ok) throw new Error("Invalid code");
      await updateBackupCodes(context.userId, backup.remaining);
    }
    await disableTwoFactor(context.userId);
    return { ok: true as const };
  });
