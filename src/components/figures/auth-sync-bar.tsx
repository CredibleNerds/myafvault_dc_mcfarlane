import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
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

export function AuthSyncBar() {
  const { user, isPending } = useCurrentUserState();
  const [sync, setSync] = useState<SyncStatus>("idle");
  const [detail, setDetail] = useState("");

  useEffect(() => subscribeSyncStatus((s, d) => {
    setSync(s);
    setDetail(d ?? "");
  }), []);

  useEffect(() => {
    if (!authEnabled) return;
    if (isPending) return;
    if (user && !user.isDevFallback) {
      void startCloudSync(user.id);
    } else {
      stopCloudSync();
    }
  }, [user?.id, user?.isDevFallback, isPending]);

  if (!authEnabled) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <SignedOut>
        <Button asChild size="sm" variant="default">
          <Link to="/login">
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Sign in to sync</span>
            <span className="sm:hidden">Sync</span>
          </Link>
        </Button>
      </SignedOut>

      <SignedIn>
        <SyncChip
          status={sync}
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
        <div className="hidden sm:block [&_button]:text-xs [&_button]:text-muted [&_span]:text-xs [&_span]:text-muted">
          <UserButton />
        </div>
        <div className="sm:hidden">
          <UserButton />
        </div>
      </SignedIn>
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
      title={detail || label}
      onClick={() => {
        if (!busy) void onResync();
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted hover:text-fg hover:border-border-strong transition-colors"
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
      <span className="hidden xs:inline sm:inline">{label}</span>
    </button>
  );
}
