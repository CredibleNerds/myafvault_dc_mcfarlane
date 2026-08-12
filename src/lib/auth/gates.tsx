import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { authEnabled, signOut } from "./client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";
import { getMyProfile, type UserProfile } from "@/lib/profile";
import { CollectorAvatar } from "@/components/account/collector-avatar";

export const SIGN_IN_PATH = "/login";

export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Navigate to={to} />;
}

export function UserButton() {
  const user = useCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user || user.isDevFallback) return;
    let cancelled = false;
    void getMyProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        /* keep session defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;
  const label =
    profile?.displayName || user.displayName || user.primaryEmail || "Account";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        to="/account/profile"
        className="inline-flex items-center gap-1.5 text-muted hover:text-fg"
        title="Customize your profile"
      >
        <CollectorAvatar
          config={profile?.avatarConfig}
          uploadSrc={profile?.avatarData}
          name={label}
          size={32}
        />
        <span className="hidden md:inline text-xs font-medium max-w-[8rem] truncate">
          {label}
        </span>
      </Link>
      {authEnabled && (
        <button
          type="button"
          onClick={() => void signOut("/")}
          className="cursor-pointer text-xs text-muted underline-offset-4 hover:text-fg hover:underline px-1"
          aria-label="Sign out"
        >
          <span className="sm:hidden">Out</span>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      )}
    </div>
  );
}
