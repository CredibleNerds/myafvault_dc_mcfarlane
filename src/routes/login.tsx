import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Package,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  GROK_PROVIDERS,
  authEnabled,
  setSessionBearer,
  signIn,
} from "@/lib/auth/client";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth/email-auth";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "signin";
    const m = new URLSearchParams(window.location.search).get("mode");
    return m === "signup" ? "signup" : "signin";
  });
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isPending && user && !user.isDevFallback) {
    return <Navigate to="/vault/dc-mcfarlane" />;
  }

  async function onProvider(providerId: string) {
    setError(null);
    setBusyProvider(providerId);
    try {
      await signIn(providerId, {
        callbackURL: "/vault/dc-mcfarlane",
        errorCallbackURL: "/login",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusyProvider(null);
    }
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (mode === "signup" && name.trim().length < 1) {
      setError("Please enter a display name");
      return;
    }

    setEmailBusy(true);
    try {
      // Server function normalizes Origin for the live-preview proxy
      // (fixes "Invalid origin" on create account).
      const result =
        mode === "signup"
          ? await signUpWithEmail({
              data: {
                email: trimmedEmail,
                password,
                name: name.trim(),
              },
            })
          : await signInWithEmail({
              data: { email: trimmedEmail, password },
            });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      // Live preview uses partitioned cookies — store the session bearer so
      // subsequent requests (and cloud sync) authenticate correctly.
      if (result.token) {
        setSessionBearer(result.token);
      }

      toast.success(
        mode === "signup"
          ? "Account created — welcome to your vault"
          : "Signed in — syncing your collection",
      );

      // Full navigation so the session store reloads with the bearer attached
      // and the 2FA gate can evaluate on a clean load.
      window.location.href = "/vault/dc-mcfarlane";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setEmailBusy(false);
    }
  }

  const anyBusy = !!busyProvider || emailBusy;

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <div className="h-1 w-full bg-primary" aria-hidden />

      <header className="border-b border-border/80">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              MyAFVault
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Package className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {mode === "signin" ? "Sign in" : "Create account"}
              </h1>
              <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
                Save owned figures, wishlist, notes, and photos to the cloud —
                then open your vault on any device.
              </p>
            </div>
          </div>

          <ul className="grid gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-3.5 text-sm">
            {[
              "Cloud backup of your collection",
              "Optional two-factor authentication",
              "Sync across phone, tablet, and desktop",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          {!authEnabled ? (
            <p className="text-sm text-muted text-center">
              Sign-in is disabled in this environment.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 rounded-[var(--radius-sm)] border border-border bg-surface p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className={cn(
                    "rounded-[var(--radius-xs)] py-2 text-sm font-medium transition-colors",
                    mode === "signin"
                      ? "bg-primary text-primary-fg shadow"
                      : "text-muted hover:text-fg",
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={cn(
                    "rounded-[var(--radius-xs)] py-2 text-sm font-medium transition-colors",
                    mode === "signup"
                      ? "bg-primary text-primary-fg shadow"
                      : "text-muted hover:text-fg",
                  )}
                >
                  Create account
                </button>
              </div>

              <div className="space-y-2.5">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    className="w-full h-11 justify-center gap-2"
                    disabled={anyBusy}
                    onClick={() => void onProvider(p.providerId)}
                  >
                    {busyProvider === p.providerId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : p.idp === "google" ? (
                      <GoogleIcon />
                    ) : (
                      <XIcon />
                    )}
                    {busyProvider === p.providerId
                      ? "Opening…"
                      : `Continue with ${p.label}`}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-bg px-3 text-subtle uppercase tracking-wide">
                    or with email
                  </span>
                </div>
              </div>

              <form onSubmit={onEmailSubmit} className="space-y-3.5">
                {mode === "signup" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Display name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                      <Input
                        id="name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Collector name"
                        className="pl-9"
                        disabled={anyBusy}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      disabled={anyBusy}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === "signup"
                          ? "At least 8 characters"
                          : "Your password"
                      }
                      className="pl-9 pr-10"
                      disabled={anyBusy}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-subtle hover:text-fg"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full h-11" disabled={anyBusy}>
                  {emailBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {mode === "signup" ? "Creating account…" : "Signing in…"}
                    </>
                  ) : mode === "signup" ? (
                    "Create account & sync"
                  ) : (
                    "Sign in & sync collection"
                  )}
                </Button>
              </form>

              <p className="text-xs text-subtle text-center leading-relaxed flex items-start justify-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>
                  After sign-in, enable 2FA under Security (header) for extra
                  protection.
                </span>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
