import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Loader2, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  confirmTwoFactorSetup,
  disableTwoFactorSetup,
  getTwoFactorStatus,
  startTwoFactorSetup,
} from "@/lib/two-factor";
import { resetCloudVault } from "@/lib/collection-sync";
import { useCatalogue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountShell } from "@/components/account/account-shell";

export const Route = createFileRoute("/account/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const { user, isPending } = useCurrentUserState();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<{
    secret: string;
    qrDataUrl: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const replaceEntries = useCatalogue((s) => s.replaceEntries);
  const replaceCollections = useCatalogue((s) => s.replaceCollections);


  useEffect(() => {
    if (isPending || !user || user.isDevFallback) return;
    void getTwoFactorStatus()
      .then((s) => setEnabled(s.enabled))
      .finally(() => setLoading(false));
  }, [user?.id, isPending]);

  if (!isPending && (!user || user.isDevFallback)) {
    return <Navigate to="/login" />;
  }

  async function beginSetup() {
    setBusy(true);
    setBackupCodes(null);
    try {
      const res = await startTwoFactorSetup();
      setSetup({ secret: res.secret, qrDataUrl: res.qrDataUrl });
      setCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start setup");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await confirmTwoFactorSetup({ data: { code } });
      setBackupCodes(res.backupCodes);
      setEnabled(true);
      setSetup(null);
      setCode("");
      toast.success("Two-factor authentication enabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function onResetVault(e: React.FormEvent) {
    e.preventDefault();
    if (resetConfirm.trim().toUpperCase() !== "RESET") {
      toast.error("Type RESET to confirm");
      return;
    }
    setBusy(true);
    try {
      await resetCloudVault();
      replaceEntries({});
      replaceCollections({});
      setResetConfirm("");
      toast.success("This account’s vault is empty now");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset vault");
    } finally {
      setBusy(false);
    }
  }

  async function onDisable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await disableTwoFactorSetup({ data: { code: disableCode } });
      setEnabled(false);
      setDisableCode("");
      setBackupCodes(null);
      toast.success("Two-factor authentication disabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountShell title="Account security" active="security">
      <p className="-mt-2 text-sm text-muted leading-relaxed">
        Protect your vault with an authenticator app (Google Authenticator,
        1Password, Authy, etc.). You'll enter a code after signing in.
      </p>

        {loading ? (
          <p className="text-sm text-muted flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 flex items-start gap-3">
              {enabled ? (
                <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
              ) : (
                <ShieldOff className="h-5 w-5 text-muted shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-sm">
                  Two-factor authentication is{" "}
                  <span className={enabled ? "text-success" : "text-muted"}>
                    {enabled ? "on" : "off"}
                  </span>
                </p>
                <p className="text-xs text-subtle mt-1">
                  {enabled
                    ? "Each new sign-in requires an authenticator code for this session."
                    : "Recommended for email accounts that hold your collection data."}
                </p>
              </div>
            </div>

            {!enabled && !setup && (
              <Button onClick={() => void beginSetup()} disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Enable authenticator
              </Button>
            )}

            {setup && (
              <div className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                <p className="text-sm text-muted">
                  1. Scan this QR code in your authenticator app
                </p>
                <div className="flex justify-center">
                  <img
                    src={setup.qrDataUrl}
                    alt="Two-factor QR code"
                    className="rounded-lg border border-border bg-white p-2"
                    width={200}
                    height={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-subtle">
                    Or enter this key manually:
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 break-all rounded bg-surface-2 px-2 py-1.5 text-xs font-mono">
                      {setup.secret}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(setup.secret);
                        toast.message("Secret copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <form onSubmit={confirmSetup} className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="confirm-code">
                      2. Enter the 6-digit code to confirm
                    </Label>
                    <Input
                      id="confirm-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      className="font-mono tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Confirm & enable
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSetup(null)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {backupCodes && (
              <div className="space-y-3 rounded-[var(--radius-lg)] border border-primary/40 bg-primary/5 p-4">
                <p className="text-sm font-medium">
                  Save these backup codes
                </p>
                <p className="text-xs text-muted">
                  Each code works once if you lose your authenticator. Store
                  them somewhere safe — they won't be shown again.
                </p>
                <ul className="grid grid-cols-2 gap-1.5 font-mono text-sm">
                  {backupCodes.map((c) => (
                    <li
                      key={c}
                      className="rounded bg-surface px-2 py-1.5 border border-border"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(backupCodes.join("\n"));
                    toast.message("Backup codes copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy all
                </Button>
              </div>
            )}

            {enabled && (
              <form
                onSubmit={onDisable}
                className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
              >
                <p className="text-sm font-medium">Disable two-factor</p>
                <p className="text-xs text-muted">
                  Enter a current authenticator or backup code to turn 2FA off.
                </p>
                <Input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="Code"
                  className="font-mono"
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="text-danger"
                  disabled={busy}
                >
                  Disable 2FA
                </Button>
              </form>
            )}

            <form
              onSubmit={onResetVault}
              className="space-y-3 rounded-[var(--radius-lg)] border border-danger/30 bg-danger/5 p-4"
            >
              <p className="text-sm font-medium">Reset this account’s vault</p>
              <p className="text-xs text-muted leading-relaxed">
                Clears In My Vault, Wishlist, notes, photos, and collections for{" "}
                <span className="text-fg">{user?.primaryEmail}</span> only.
                Other accounts are not changed.
              </p>
              <Label htmlFor="reset-vault">Type RESET to confirm</Label>
              <Input
                id="reset-vault"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="RESET"
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="outline"
                className="text-danger"
                disabled={busy || resetConfirm.trim().toUpperCase() !== "RESET"}
              >
                Reset my collection
              </Button>
            </form>
          </div>
        )}
    </AccountShell>
  );
}
