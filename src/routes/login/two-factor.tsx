import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import {
  getTwoFactorStatus,
  verifyTwoFactorChallenge,
} from "@/lib/two-factor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login/two-factor")({
  component: TwoFactorChallengePage,
});

function TwoFactorChallengePage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsChallenge, setNeedsChallenge] = useState<boolean | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.isDevFallback) return;
    void getTwoFactorStatus()
      .then((s) => {
        setNeedsChallenge(s.requiresChallenge);
        if (!s.requiresChallenge) void navigate({ to: "/" });
      })
      .catch(() => setNeedsChallenge(false));
  }, [user?.id, isPending, navigate]);

  if (!isPending && (!user || user.isDevFallback)) {
    return <Navigate to="/login" />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyTwoFactorChallenge({ data: { code } });
      toast.success("Two-factor verified");
      void navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="h-1 w-full bg-primary" aria-hidden />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Two-factor authentication
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              Enter the 6-digit code from your authenticator app
              {user?.displayName ? ` for ${user.displayName}` : ""}, or a backup
              code.
            </p>
          </div>

          {needsChallenge === null ? (
            <p className="text-center text-sm text-muted flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="otp">Authentication code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg tracking-[0.3em] font-mono"
                  maxLength={16}
                  disabled={busy}
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p
                  className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify and continue"
                )}
              </Button>

              <div className="flex justify-between text-xs text-muted">
                <button
                  type="button"
                  className="hover:text-fg underline-offset-4 hover:underline"
                  onClick={() => void signOut("/login")}
                >
                  Sign out
                </button>
                <Link to="/account/security" className="hover:text-fg underline-offset-4 hover:underline">
                  Security settings
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
