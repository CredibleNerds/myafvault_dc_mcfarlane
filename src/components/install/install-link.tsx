import { Link } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";

export function InstallLink({ className }: { className?: string }) {
  return (
    <Link
      to="/install"
      title="Install as an app"
      aria-label="Install as an app"
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-fg hover:border-border-strong"
      }
    >
      <Smartphone className="h-4 w-4" />
    </Link>
  );
}
