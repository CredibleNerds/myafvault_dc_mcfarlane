import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { authEnabled, signOut } from "./client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";
import { getMyProfile } from "@/lib/profile";
import { CATALOG_BY_ID } from "@/data/catalog";

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
  const [avatar, setAvatar] = useState<string | null>(user?.profileImageUrl ?? null);
  const [name, setName] = useState(user?.displayName ?? user?.primaryEmail ?? "Account");

  useEffect(() => {
    if (!user || user.isDevFallback) return;
    let cancelled = false;
    void getMyProfile()
      .then((p) => {
        if (cancelled) return;
        if (p.displayName) setName(p.displayName);
        if (p.avatarKind === "upload" && p.avatarData) setAvatar(p.avatarData);
        else if (p.avatarKind === "figure" && p.avatarProductId) {
          setAvatar(CATALOG_BY_ID[p.avatarProductId]?.imageUrl ?? null);
        }
      })
      .catch(() => {
        /* keep session defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;
  const label = name || user.displayName || user.primaryEmail || "Account";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        to="/account/profile"
        className="inline-flex items-center gap-1.5 text-muted hover:text-fg"
        title="Your profile"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover border border-border sm:h-7 sm:w-7"
          />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary border border-primary/30 sm:h-7 sm:w-7">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden md:inline text-xs font-medium max-w-[8rem] truncate">
          {label}
        </span>
        <UserRound className="hidden lg:inline h-3.5 w-3.5" />
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
