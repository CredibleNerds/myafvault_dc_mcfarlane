import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cloud, CloudOff, Loader2, LogIn, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  SignedIn,
  SignedOut,
  UserButton,
} from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  forceResync,
  startCloudSync,
  stopCloudSync,
  subscribeSyncStatus,
  type SyncStatus,
} from "@/lib/sync-client";
import { Button } from "@/components/ui/button";
import { authEnabled } from "@/lib/auth/client";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthSyncBar() {
  const { user, isPending } = useCurrentUserState();
  const [sync, setSync] = useState<SyncStatus>("idle");
  const [detail, setDetail] = useState("");

  useEffect(
    () =>
      subscribeSyncStatus((s, d) => {
        setSync(s);
        setDetail(d ?? "");
      }),
    [],
  );

  useEffect(() => {
    if (!authEnabled) return;
    if (isPending) return;
    if (user && !user.isDevFallback) {
      void startCloudSync(user.id);
    } else {
      stopCloudSync();
    }
  }, [user?.id, user?.isDevFallback, isPending]);

  return (
    <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-3">

      <ThemeToggle />

      {authEnabled && (
        <>
          <SignedOut>
            <Button asChild size="sm" variant="default">
              <Link to="/login">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign in</span>
                <span className="sm:hidden">Sign in</span>
              </Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <SyncChip
              status={isPending ? "pulling" : sync}
              detail={detail}
              onResync={async () => {
                try {
                  await forceResync();
                  toast.success("Re-synced");
                } catch {
                  toast.error("Could not re-sync");
                }
              }}
            />
            <UserButton />
          </SignedIn>
        </>
      )}
    </div>
  );
}

function SyncChip({
  status,
  detail,
  onResync,
}: {
  status: SyncStatus;
  detail: string;
  onResync: () => void;
}) {
  const busy = status === "pulling" || status === "pushing";
  const label =
    status === "pulling"
      ? "Pulling…"
      : status === "pushing"
        ? "Saving…"
        : status === "synced"
          ? "Synced"
          : status === "error"
            ? "Sync error"
            : "Cloud";

  return (
    <button
      type="button"
      onClick={() => {
        if (!busy) void onResync();
      }}
      disabled={busy}
      title={detail || "Re-sync collection"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-70 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px] sm:font-medium"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      ) : status === "error" ? (
        <CloudOff className="h-3.5 w-3.5 text-danger" />
      ) : status === "synced" ? (
        <Cloud className="h-3.5 w-3.5 text-success" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
