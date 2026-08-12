import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Lock, Package } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createCheckoutSession,
  getAccessStatus,
} from "@/lib/billing";
import { VAULT_ACCESS, PRIMARY_VAULT_PATH } from "@/lib/franchises";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/pay")({
  component: PayPage,
  head: () => ({
    meta: [
      { title: "Unlock MyAFVault — $3.99 lifetime access" },

      {
        name: "description",
        content:
          "One-time $3.99 payment unlocks the DC McFarlane vault, cloud sync, and your collection.",

      },
    ],
  }),
});

function PayPage() {
  const { user, isPending } = useCurrentUserState();
  const signedIn = !isPending && !!user && !user.isDevFallback;
  const [checking, setChecking] = useState(true);
  const [paid, setPaid] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const canceled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("canceled") === "1";

  useEffect(() => {
    if (isPending) return;
    if (!signedIn) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    void getAccessStatus()
      .then((s) => {
        if (cancelled) return;
        setPaid(s.paid);
        setStripeReady(s.stripeReady);
      })
      .catch(() => {
        if (!cancelled) setStripeReady(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, signedIn]);

  async function startCheckout() {
    setBusy(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
      setBusy(false);
    }
  }

  if (isPending || checking) {
    return (
      <div className="min-h-dvh grid place-items-center bg-bg text-muted">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Checking access…
        </div>
      </div>
    );
  }

  if (!signedIn) {
    if (typeof window !== "undefined") {
      window.location.replace("/login?mode=signup&next=/pay");
    }
    return null;
  }


  if (paid) {
    return <Navigate to={PRIMARY_VAULT_PATH} />;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      <div className="h-1 w-full bg-primary" aria-hidden />
      <header className="border-b border-border/80">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Package className="h-7 w-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Unlock your vault
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              One-time {VAULT_ACCESS.priceLabel} payment. No subscription.
            </p>
          </div>

          {canceled && (
            <p
              className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm text-muted"
              role="status"
            >
              Checkout was canceled. You can try again when you are ready.
            </p>
          )}

          <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 space-y-4">
            <p className="flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tabular-nums">
                {VAULT_ACCESS.priceLabel}
              </span>
              <span className="text-sm text-muted">lifetime</span>
            </p>
            <ul className="space-y-2">
              {[
                "Full DC McFarlane catalogue",
                "Cloud sync of vault, wishlist, and photos",
                "Collections and sharing",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            {stripeReady ? (
              <Button
                className="w-full h-11"
                size="lg"
                disabled={busy}
                onClick={() => void startCheckout()}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening Stripe…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {VAULT_ACCESS.priceLabel} with Stripe
                  </>
                )}
              </Button>
            ) : (
              <p className="text-sm text-muted">
                Stripe is not connected on this site yet. Add your Stripe keys
                and this button will take collectors to checkout.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
