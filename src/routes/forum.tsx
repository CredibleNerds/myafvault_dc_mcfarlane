import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authEnabled } from "@/lib/auth/client";
import { getAccessStatus } from "@/lib/billing";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/lib/auth/gates";
import { ForumBoard } from "@/components/forum/forum-board";
import { InstallLink } from "@/components/install/install-link";
import { InstallPrompt } from "@/components/install/install-prompt";


export const Route = createFileRoute("/forum")({
  component: ForumPage,
  head: () => ({
    meta: [{ title: "Collector board · MyAFVault" }],
  }),
});

function ForumPage() {
  const { user, isPending } = useCurrentUserState();
  const signedIn = !!user && !user.isDevFallback;
  const [accessPending, setAccessPending] = useState(true);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);

  useEffect(() => {
    if (!authEnabled || !signedIn) {
      setAccessPending(false);
      return;
    }
    void getAccessStatus()
      .then((s) => setHasPaidAccess(s.paid))

      .finally(() => setAccessPending(false));
  }, [signedIn]);

  if (authEnabled && (isPending || (signedIn && accessPending))) {
    return (
      <div className="min-h-dvh grid place-items-center bg-bg text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }
  if (authEnabled && !signedIn) {
    return <Navigate to="/login" />;

  }
  if (authEnabled && signedIn && !hasPaidAccess) {
    return <Navigate to="/pay" />;
  }

  return (
    <div className="min-h-dvh bg-bg">
      <div className="h-1 w-full bg-primary" aria-hidden />
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/vault/dc-mcfarlane"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Vault
          </Link>
          <div className="flex items-center gap-3">
            <InstallLink />
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="px-4 py-6 sm:py-8">
        <ForumBoard />
      </main>
      <InstallPrompt />
    </div>
  );
}
