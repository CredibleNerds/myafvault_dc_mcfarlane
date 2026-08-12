import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Smartphone } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/lib/auth/gates";
import { InstallSteps } from "@/components/install/install-steps";

export const Route = createFileRoute("/install")({
  component: InstallPage,
  head: () => ({
    meta: [{ title: "Install MyAFVault · Home Screen app" }],
  }),
});

function InstallPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="h-1 w-full bg-primary" aria-hidden />
      <header className="border-b border-border/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <Link
            to="/vault/dc-mcfarlane"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Vault
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div className="space-y-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary/15 text-primary">
            <Smartphone className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Install MyAFVault as an app
          </h1>
          <p className="max-w-xl text-sm text-muted leading-relaxed">
            Turn the vault into an icon on your phone or computer. It is still
            this website — just launched like an app, with your collection
            signed in and synced.
          </p>
        </div>
        <InstallSteps />
      </main>
    </div>
  );
}
