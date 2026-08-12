import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AccountShell({
  title,
  children,
  active,
}: {
  title: string;
  children: ReactNode;
  active: "profile" | "security";
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <div className="h-1 w-full bg-primary" aria-hidden />
      <header className="border-b border-border/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
          <Link
            to="/vault/dc-mcfarlane"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Vault
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <nav className="flex gap-1 rounded-[var(--radius-sm)] border border-border bg-surface p-1">
            <Link
              to="/account/profile"
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-xs)] py-2 text-sm font-medium",
                active === "profile"
                  ? "bg-primary text-primary-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              <UserRound className="h-4 w-4" />
              Profile
            </Link>
            <Link
              to="/account/security"
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-xs)] py-2 text-sm font-medium",
                active === "security"
                  ? "bg-primary text-primary-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              <Shield className="h-4 w-4" />
              Security
            </Link>
          </nav>
        </div>
        {children}
      </main>
    </div>
  );
}
