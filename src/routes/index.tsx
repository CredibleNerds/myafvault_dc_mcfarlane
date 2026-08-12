import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  ArrowRight,
  Camera,
  Check,
  Cloud,
  Layers,
  Lock,
  Package,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  FRANCHISES,
  PRIMARY_VAULT_PATH,
  VAULT_ACCESS,
} from "@/lib/franchises";
import { catalogStats } from "@/data/catalog";
import { cn } from "@/lib/utils";
import { VaultPreview } from "@/components/landing/vault-preview";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: "MyAFVault — Collect. Index. Display. Your figures, one vault.",
      },
      {
        name: "description",
        content:
          "MyAFVault is your DC McFarlane Multiverse vault — catalogue, photos, ownership, and cloud sync. Lifetime access $4.99.",
      },
    ],
  }),
});

const FEATURES = [
  {
    icon: Search,
    title: "Master catalogue",
    body: "Browse official product shots, scales, lines, and package accessories — not a blank spreadsheet.",
  },
  {
    icon: Package,
    title: "In My Vault tracking",
    body: "Mark figures you have, build a wishlist, bulk-update ownership, and see your vault grow.",
  },
  {
    icon: Camera,
    title: "Your photos",
    body: "Upload shelf shots and loose figure photos. Prefer yours as the cover without losing the official pack art.",
  },
  {
    icon: Layers,
    title: "Displays & collections",
    body: "Group Justice League, Teen Titans, or The Dark Knight shelf photos in one place — multi-figure sets included.",
  },
  {
    icon: Cloud,
    title: "Cloud sync",
    body: "Sign in once. Notes, photos, and ownership follow you across phone, tablet, and desktop.",
  },
  {
    icon: Shield,
    title: "Optional 2FA",
    body: "Lock the vault with two-factor authentication when you want extra protection on your collection data.",
  },
] as const;

const PREVIEW_STEPS = [
  {
    step: "01",
    title: "Browse the master list",
    body: "Filter by 7\", Megafig, statue, multipack, or vehicle. Search character, line, or SKU.",
  },
  {
    step: "02",
    title: "Mark what you own",
    body: "Tap In My Vault, set condition and price, add notes — or bulk-select a whole wave.",
  },
  {
    step: "03",
    title: "Photograph & display",
    body: "Attach personal photos, then build Collections for team shelves and movie lineups.",
  },
] as const;

function LandingPage() {
  const { user, isPending } = useCurrentUserState();
  const signedIn = !isPending && !!user && !user.isDevFallback;
  const stats = catalogStats();

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) {
      window.location.replace(`/login?error=${encodeURIComponent(err)}`);
    }
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="h-1 w-full bg-primary" aria-hidden />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="min-w-0 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-primary-fg">
              <Package className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                MyAFVault
              </span>
              <span className="block truncate text-sm font-semibold tracking-tight">
                Action Figure Vaults
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle className="hidden sm:flex" />
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <a href="#features">Features</a>
            </Button>
            <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
              <a href="#vaults">Vaults</a>
            </Button>
            <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
              <a href="#pricing">Pricing</a>
            </Button>
            {signedIn ? (
              <Button asChild size="sm">
                <Link to={PRIMARY_VAULT_PATH}>
                  Open vault
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="outline">
                  <a href="/login?mode=signin">
                    Sign in
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href="/login?mode=signup">
                    Sign up for access
                  </a>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 70% -10%, color-mix(in oklab, var(--color-primary) 28%, transparent), transparent 55%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl lg:max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:items-center">
              <div className="space-y-6">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight leading-[1.12] text-balance">
                  The Vault for the DC McFarlane figures you collect.
                  <span className="block text-muted font-medium mt-2 text-2xl sm:text-3xl lg:text-[2rem]">
                    7" figures, megafigs, statues, multipacks, and vehicles.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed text-pretty">
                  Catalogue official figures with accessories and pack shots,
                  mark what is In My Vault, upload your photos, and build shelf
                  Collections — synced to the cloud when you sign in.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {signedIn ? (
                    <Button asChild size="lg" className="h-11 px-5">
                      <Link to={PRIMARY_VAULT_PATH}>
                        Open DC McFarlane vault
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg" className="h-11 px-5">
                        <a href="/login?mode=signup">
                          Sign up for access
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="h-11 px-5">
                        <a href="/login?mode=signin">
                          Sign in
                        </a>
                      </Button>
                    </>
                  )}
                  <Button asChild size="lg" variant="ghost" className="h-11 px-5">
                    <a href="#pricing">
                      {VAULT_ACCESS.priceLabel} lifetime access
                    </a>
                  </Button>
                </div>
                {!signedIn && (
                  <p className="text-xs text-subtle">
                    Account required — catalogue and vault tools unlock after sign-up.
                    Lifetime cloud access is {VAULT_ACCESS.priceLabel} one-time.
                  </p>
                )}
                <dl className="grid grid-cols-3 gap-3 max-w-md pt-2">
                  <div className="rounded-[var(--radius-md)] border border-border bg-surface p-3">
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">
                      Catalog
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {stats.total.toLocaleString()}+
                    </dd>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-border bg-surface p-3">
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">
                      Categories
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums">5</dd>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-border bg-surface p-3">
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">
                      Access
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {VAULT_ACCESS.priceLabel}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="relative">
                <VaultPreview />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-border" id="how">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="max-w-2xl mb-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
                How it works
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Built for how collectors actually track a line
              </h2>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {PREVIEW_STEPS.map((s) => (
                <li
                  key={s.step}
                  className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 sm:p-6"
                >
                  <p className="text-xs font-semibold tabular-nums text-primary mb-3">
                    {s.step}
                  </p>
                  <h3 className="font-semibold text-base mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border" id="features">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="max-w-2xl mb-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
                Features
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Everything in the vault
              </h2>
              <p className="text-muted mt-2 text-sm sm:text-base max-w-xl">
                Built for DC McFarlane Multiverse collectors — catalogue, track,
                and display every figure in one vault.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-[var(--radius-xl)] border border-border bg-surface p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary/12 text-primary ring-1 ring-primary/20">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DC McFarlane vault */}
        <section className="border-b border-border" id="vaults">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div className="max-w-2xl">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
                  The vault
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  DC McFarlane Multiverse
                </h2>
                <p className="text-muted mt-2 text-sm sm:text-base">
                  One dedicated database for McFarlane’s DC line — official
                  listings, accessories, and your personal collection.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-1 max-w-xl">
              {FRANCHISES.filter((f) => f.status === "live").map((f) => {
                const live = f.status === "live";
                const CardInner = (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                          {live ? "Available now" : "Planned vault"}
                        </p>
                        <h3 className="text-lg font-semibold tracking-tight mt-0.5">
                          {f.name}
                        </h3>
                      </div>
                      <Badge variant={live ? "default" : "secondary"}>
                        {live ? "Live" : "Coming soon"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted leading-relaxed mb-4">
                      {f.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {f.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] text-muted"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                      <span className="text-xs text-subtle">{f.scopeNote}</span>
                      {live ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          {signedIn ? "Open vault" : "Sign up for access"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-subtle">
                          Not yet available
                        </span>
                      )}
                    </div>
                  </>
                );

                if (live && f.path) {
                  if (signedIn) {
                    return (
                      <Link
                        key={f.id}
                        to={f.path}
                        className={cn(
                          "block rounded-[var(--radius-xl)] border p-5 sm:p-6 transition-colors",
                          "border-primary/40 bg-primary/[0.06] hover:border-primary hover:bg-primary/10",
                        )}
                      >
                        {CardInner}
                      </Link>
                    );
                  }
                  return (
                    <a
                      key={f.id}
                      href="/login?mode=signup"
                      className={cn(
                        "block rounded-[var(--radius-xl)] border p-5 sm:p-6 transition-colors",
                        "border-primary/40 bg-primary/[0.06] hover:border-primary hover:bg-primary/10",
                      )}
                    >
                      {CardInner}
                    </a>
                  );
                }

                return (
                  <div
                    key={f.id}
                    className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 sm:p-6 opacity-90"
                  >
                    {CardInner}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing — Stripe later */}
        <section className="border-b border-border" id="pricing">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="max-w-2xl mb-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
                Pricing
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Lifetime vault access
              </h2>
              <p className="text-muted mt-2 text-sm sm:text-base">
                Sign up for vault access. Unlock the full DC McFarlane catalogue, cloud
                sync, and multi-device storage with a single payment.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 sm:p-8">
                <p className="text-sm font-medium text-muted mb-1">
                  {VAULT_ACCESS.productName}
                </p>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">
                    {VAULT_ACCESS.priceLabel}
                  </span>
                  <span className="text-sm text-muted">one-time</span>
                </p>
                <p className="text-sm text-muted mt-3 leading-relaxed">
                  {VAULT_ACCESS.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Cloud backup of ownership, notes, and photos",
                    "Collections & multi-figure displays",
                    "Optional two-factor security",
                    "Full DC McFarlane Multiverse catalogue",
                    "No subscription — pay once",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    size="lg"
                    className="h-11"
                    disabled
                    title="Stripe checkout will be connected next"
                  >
                    <Lock className="h-4 w-4" />
                    Pay {VAULT_ACCESS.priceLabel} — Stripe coming soon
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-11">
                    <a href="/login?mode=signup">
                      Sign up for access
                    </a>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-subtle flex items-start gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Secure Stripe Checkout will be wired next. You can already
                  create an account and use the DC McFarlane vault.
                </p>
              </div>

              <div className="rounded-[var(--radius-xl)] border border-border bg-surface-2/60 p-6 sm:p-8 flex flex-col justify-center">
                <h3 className="font-semibold text-lg mb-2">
                  Sign up for vault access
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-5">
                  Create an account to enter the{" "}
                  <strong className="text-fg font-medium">
                    DC McFarlane
                  </strong>{" "}
                  database. There is no free browse mode — the vault unlocks after
                  you sign up.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {signedIn ? (
                    <Button asChild size="lg" className="h-11">
                      <Link to={PRIMARY_VAULT_PATH}>
                        Continue to DC McFarlane
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg" className="h-11">
                        <a href="/login?mode=signup">
                          Sign up for access
                        </a>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="h-11">
                        <a href="/login?mode=signin">
                          Sign in
                        </a>
                      </Button>
                    </>
                  )}
                </div>
                <p className="mt-4 text-xs text-subtle">
                  Use the interactive figure preview above to see how catalogue,
                  ownership, accessories, and collections work before you join.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
              Ready to index your McFarlane shelf?
            </h2>
            <p className="text-muted mt-2 max-w-lg mx-auto text-sm sm:text-base">
              Sign up for access to the DC vault, then claim lifetime cloud access
              for {VAULT_ACCESS.priceLabel} when Stripe goes live.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              {signedIn ? (
                <Button asChild size="lg" className="h-11 px-6">
                  <Link to={PRIMARY_VAULT_PATH}>
                    Open DC McFarlane vault
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="h-11 px-6">
                    <a href="/login?mode=signup">
                      Sign up for access
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-11 px-6">
                    <a href="/login?mode=signin">
                      Sign in
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">MyAFVault</p>
            <p className="text-xs text-subtle mt-0.5">
              DC McFarlane Multiverse catalogue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {signedIn ? (
              <Link to={PRIMARY_VAULT_PATH} className="hover:text-fg">
                DC vault
              </Link>
            ) : (
              <a href="/login?mode=signup" className="hover:text-fg">
                Sign up for access
              </a>
            )}
            <a href="#pricing" className="hover:text-fg">
              Pricing
            </a>
            <a href="/login?mode=signin" className="hover:text-fg">
              Sign in
            </a>
            <ThemeToggle className="sm:hidden" />
          </div>
        </div>
      </footer>
    </div>
  );
}
