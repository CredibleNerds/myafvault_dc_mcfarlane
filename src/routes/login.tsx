import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Cloud } from "lucide-react";
import {
  GROK_PROVIDERS,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isPending && user && !user.isDevFallback) {
    return <Navigate to="/" />;
  }

  async function onProvider(providerId: string) {
    setError(null);
    setBusy(providerId);
    try {
      await signIn(providerId, { callbackURL: "/", errorCallbackURL: "/login" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(null);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border/80">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to catalogue
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Cloud className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Cloud sync
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              Sign in to save your owned figures, wishlist, notes, and personal
              photos to the cloud — then open the vault on any device.
            </p>
          </div>

          {authEnabled ? (
            <div className="space-y-3">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full h-11"
                  disabled={!!busy}
                  onClick={() => void onProvider(p.providerId)}
                >
                  {busy === p.providerId
                    ? "Opening…"
                    : `Continue with ${p.label}`}
                </Button>
              ))}
              {error && (
                <p className="text-sm text-danger text-center" role="alert">
                  {error}
                </p>
              )}
              <p className="text-xs text-subtle text-center leading-relaxed pt-1">
                Your collection stays private to your account. Local data on
                this device merges with the cloud after sign-in.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted text-center">
              Sign-in is disabled in this environment.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
