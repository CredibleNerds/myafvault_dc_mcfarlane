import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, Package } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { confirmCheckoutSession, getAccessStatus } from "@/lib/billing";
import { PRIMARY_VAULT_PATH } from "@/lib/franchises";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pay/success")({
  component: PaySuccessPage,
  head: () => ({
    meta: [{ title: "Payment received — MyAFVault" }],
  }),
});

function PaySuccessPage() {
  const { user, isPending } = useCurrentUserState();
  const signedIn = !isPending && !!user && !user.isDevFallback;
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!signedIn) {
      window.location.replace("/login?mode=signin&next=/pay/success" + window.location.search);
      return;
    }
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    let cancelled = false;
    async function run() {
      try {
        if (sessionId) {
          await confirmCheckoutSession({ data: { sessionId } });
        } else {
          const status = await getAccessStatus();
          if (!status.paid) throw new Error("Payment is still processing.");
        }
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not confirm payment");
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [isPending, signedIn]);

  if (ready) {
    return <Navigate to={PRIMARY_VAULT_PATH} />;
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-bg px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {error ? <Package className="h-7 w-7" /> : <Check className="h-7 w-7" />}
        </div>
        {error ? (
          <>
            <h1 className="text-xl font-semibold">Payment not confirmed yet</h1>
            <p className="text-sm text-muted">{error}</p>
            <Button asChild>
              <Link to="/pay">Back to checkout</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Confirming your payment…
            </div>
          </>
        )}
      </div>
    </div>
  );
}
