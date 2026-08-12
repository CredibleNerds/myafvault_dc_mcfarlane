import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import {
  ArrowRight,
  Camera,
  Check,
  Cloud,
  Heart,
  Layers,
  Lock,
  MessagesSquare,
  Package,
  Search,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Star,
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
import { FeedbackButton } from "@/components/feedback-button";


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
          "MyAFVault is the DC McFarlane collector vault — 1,000+ official listings, In My Vault tracking, wishlist, photos, collections, sharing, and a collector board. Lifetime access $4.99.",
      },
    ],
  }),
});

const FEATURES = [
  {
    icon: Search,
    title: "The full McFarlane DC list",
    body: "1,000+ official 7\" figures, Megafigs, statues, multipacks, vehicles, Super Powers, Super Friends, and chase variants — with pack shots and every accessory called out.",
  },
  {
    icon: Package,
    title: "In My Vault",
    body: "Mark what you own, set condition and price, add notes, and bulk-update a whole wave. See the collection grow without a spreadsheet.",
  },
  {
    icon: Heart,
    title: "Wishlist that stays separate",
    body: "Park grails and gaps on a blue Wishlist. Share it. Keep it out of your owned count until they land on the shelf.",
  },
  {
    icon: Star,
    title: "Platinum & Red Platinum seals",

    body: "Chase variants are labeled so you can tell a standard Platinum from a Red Platinum at a glance.",
  },
  {
    icon: Camera,
    title: "Your photos, your cover",
    body: "Upload loose shots and shelf photos. Set the picture you see without changing what anyone else sees.",
  },
  {
    icon: Layers,
    title: "Displays & collections",
    body: "Group Justice League, Teen Titans, or The Dark Knight shelf. Custom listings stay private unless you share them.",
  },
  {
    icon: Share2,
    title: "Share the shelf",
    body: "Send a link to a figure, a collection, your wishlist, or your whole vault — no login required for the person you send it to.",
  },
  {
    icon: MessagesSquare,
    title: "Collector board",
    body: "Opt in to post photos, ask questions, like other collectors’ shots, and talk McFarlane without mixing it into your private vault.",
  },
  {
    icon: Smartphone,
    title: "App on every device",
    body: "Install to the Home Screen on iPhone, Android, Windows, or Mac. Cloud sync keeps ownership, notes, and photos with the account.",
  },
  {
    icon: Cloud,
    title: "Cloud sync",
    body: "Sign in once. Notes, photos, and ownership follow you across phone, tablet, and desktop.",
  },
  {
    icon: Shield,
    title: "Locked down if you want",
    body: "Email sign-in, optional 2FA, and a password-protected vault reset. Your collection is yours.",
  },
] as const;

const PREVIEW_STEPS = [
  {
    step: "01",
    title: "Browse the master list",
    body: "Filter by 7\", Megafig, statue, multipack, or vehicle. Search character, line, SKU, or Platinum chase.",
  },
  {
    step: "02",
    title: "Mark the shelf",
    body: "Tap In My Vault or Wishlist. Bulk-select a wave. Add condition, price paid, and notes.",
  },
  {
    step: "03",
    title: "Photograph & display",
    body: "Drop in personal photos, pin a favorite cover, then build Collections for team shelves and movie lineups.",
  },
  {
    step: "04",
    title: "Share or talk shop",
    body: "Send a wishlist or vault link, or join the collector board to show a shelf and ask questions.",
  },
] as const;

const WHY = [
  "Stop guessing which McFarlane DC figures exist — the catalogue is already built.",
  "Know what you own vs. what you still need without mixing the two.",
  "Keep pack art and your own photos, including custom listings only you see.",
  "Show the shelf to friends without handing them your login.",
  "Open it like an app on your phone or computer. Pay once.",
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
                  The vault for the DC McFarlane figures you collect.
                  <span className="block text-muted font-medium mt-2 text-2xl sm:text-3xl lg:text-[2rem]">
                    Catalog the line. Claim the shelf. Share the hunt.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed text-pretty">
                  A living catalogue of McFarlane’s DC figures — official
                  figure pics, accessories list, Platinum chases — add your
                  figures to In My Vault, create a wishlist, add your own
                  photos, create your collections, a collector board.
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
                        <a href="/login?mode=signup&next=/pay">
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
                    Account required. Lifetime cloud access is {VAULT_ACCESS.priceLabel}{" "}
                    one-time — catalogue, vault, board, and install included.

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
                Built for how collectors actually run a line
              </h2>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Why */}
        <section className="border-b border-border" id="why">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="max-w-2xl mb-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
                Why this exists
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Built because the line is huge and the shelf is personal
              </h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {WHY.map((reason) => (
                <li
                  key={reason}
                  className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
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
                Why collectors use the vault
              </h2>
              <p className="text-muted mt-2 text-sm sm:text-base max-w-xl">
                Spreadsheets forget accessories. Camera rolls hide the shelf.
                MyAFVault is the index and the display case.
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
                  listings, accessories, Platinum chases, your photos, and a
                  board for other collectors.

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

        {/* Pricing */}
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
                Sign up, then pay once with Stripe. Unlock the full DC McFarlane
                catalogue, In My Vault, wishlist, photos, collections, collector
                board, and Home Screen install.

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
                    "Full DC McFarlane Multiverse catalogue",
                    "In My Vault, Wishlist, notes, and price paid",
                    "Your photos plus official pack shots",
                    "Collections, custom listings, and share links",
                    "Collector board — photos, questions, likes",
                    "Install as an app on phone or computer",
                    "Cloud sync and optional two-factor security",
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
                  <Button asChild size="lg" className="h-11">
                    <a href={signedIn ? "/pay" : "/login?mode=signup&next=/pay"}>
                      <Lock className="h-4 w-4" />
                      Pay {VAULT_ACCESS.priceLabel} with Stripe
                    </a>
                  </Button>
                  {!signedIn && (
                    <Button asChild size="lg" variant="outline" className="h-11">
                      <a href="/login?mode=signup&next=/pay">
                        Sign up first
                      </a>
                    </Button>
                  )}
                </div>
                <p className="mt-3 text-xs text-subtle flex items-start gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Secure Stripe Checkout. Pay once — no subscription.
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
                  database. After sign-up, pay {VAULT_ACCESS.priceLabel} once
                  to unlock the catalogue, your vault, the collector board, and
                  install-as-app.

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
                        <a href="/login?mode=signup&next=/pay">
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
            Ready to put the McFarlane shelf in one place?

            </h2>
            <p className="text-muted mt-2 max-w-lg mx-auto text-sm sm:text-base">
              Create an account, then unlock lifetime access for{" "}
              {VAULT_ACCESS.priceLabel} with Stripe.
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
                    <a href="/login?mode=signup&next=/pay">
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
              DC McFarlane Multiverse catalogue, collector vault, and board.

            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {signedIn ? (
              <Link to={PRIMARY_VAULT_PATH} className="hover:text-fg">
                DC vault
              </Link>
            ) : (
              <a href="/login?mode=signup&next=/pay" className="hover:text-fg">
                Sign up for access
              </a>
            )}
            <a href="/install" className="hover:text-fg">
              Install app
            </a>
            <FeedbackButton />
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
