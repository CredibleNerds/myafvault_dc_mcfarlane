import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authEnabled } from "@/lib/auth/client";
import { getTwoFactorStatus } from "@/lib/two-factor";

/**
 * When the signed-in user has 2FA enabled but this session is not unlocked,
 * redirect to the challenge page (except while on auth/security routes).
 */
export function TwoFactorGate({ children }: { children: React.ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!authEnabled || isPending) return;
    if (!user || user.isDevFallback) return;

    const allowedWhileLocked = [
      "/login",
      "/login/two-factor",
      "/account/security",
    ];
    if (allowedWhileLocked.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return;
    }

    let cancelled = false;
    setChecking(true);
    void getTwoFactorStatus()
      .then((status) => {
        if (cancelled) return;
        if (status.requiresChallenge) {
          void navigate({ to: "/login/two-factor" });
        }
      })
      .catch(() => {
        /* fail open on transient errors */
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.isDevFallback, isPending, pathname, navigate]);

  if (
    checking &&
    pathname !== "/login/two-factor" &&
    pathname !== "/account/security"
  ) {
    return (
      <div className="min-h-dvh grid place-items-center text-sm text-muted">
        Checking security…
      </div>
    );
  }

  return <>{children}</>;
}
