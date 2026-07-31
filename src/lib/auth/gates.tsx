import type { ReactNode } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { authEnabled, signOut } from "./client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

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
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return (
    <div className="flex items-center gap-2">
      {user.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt=""
          className="h-7 w-7 rounded-full object-cover border border-border"
        />
      ) : (
        <span
          className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary border border-primary/30"
          title={label}
        >
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="hidden md:inline text-xs font-medium text-muted max-w-[8rem] truncate">
        {label}
      </span>
      <Link
        to="/account/security"
        className="hidden sm:inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
        title="Security settings"
      >
        <Shield className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">2FA</span>
      </Link>
      {authEnabled && (
        <button
          type="button"
          onClick={() => void signOut("/")}
          className="cursor-pointer text-xs text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Sign out
        </button>
      )}
    </div>
  );
}
