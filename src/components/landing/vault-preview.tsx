import { useMemo, useState } from "react";
import {
  Camera,
  Check,
  Cloud,
  Heart,
  Layers,
  Package,
  Search,
  X,
  ZoomIn,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATALOG_BY_ID } from "@/data/catalog";
import { categoryLabel } from "@/lib/product";
import { cn } from "@/lib/utils";

type DemoFeature =
  | "catalog"
  | "vaulted"
  | "wishlist"
  | "accessories"
  | "collections"
  | "sync";

type PreviewCard = {
  productId: string;
  badge: string;
  feature: DemoFeature;
  featureTitle: string;
  featureBody: string;
};

const PREVIEW_CARDS: PreviewCard[] = [
  {
    productId: "mcf-the-joker-the-dark-knight-deluxe-theatrical-edition",
    badge: "In My Vault",
    feature: "vaulted",
    featureTitle: "In My Vault tracking",
    featureBody:
      "Mark a figure as In My Vault, set condition and purchase notes, and see a clear status chip next to the title — never covering the pack shot.",
  },
  {
    productId: "mcf-wonder-woman-dc-classic-mcfarlane-collector-edition-61",
    badge: "Accessories",
    feature: "accessories",
    featureTitle: "Package accessories listed",
    featureBody:
      "Every release lists what is in the box — extra hands, weapons, cards, bases — so you know if a loose figure is complete.",
  },
  {
    productId: "mcf-darkseid-dc-classic",
    badge: "Wishlist",
    feature: "wishlist",
    featureTitle: "Wishlist & hunt list",
    featureBody:
      "Save targets you do not own yet. Filter the catalogue to wishlist-only when you are shopping or trading.",
  },
  {
    productId: "mcf-batman-vs-bane-2pk",
    badge: "Catalogue",
    feature: "catalog",
    featureTitle: "Master catalogue with pack shots",
    featureBody:
      "Browse official McFarlane product photos across 7\", Megafigs, statues, multipacks, and vehicles — search by character, line, or SKU.",
  },
];

const FEATURE_TABS: {
  id: DemoFeature;
  label: string;
  icon: typeof Search;
  title: string;
  body: string;
}[] = [
  {
    id: "catalog",
    label: "Catalogue",
    icon: Search,
    title: "Master catalogue",
    body: "Official images, scale, line, and category filters so you can find any Multiverse release fast.",
  },
  {
    id: "vaulted",
    label: "Vaulted",
    icon: Check,
    title: "In My Vault",
    body: "Ownership tracking with a red checkmark and status chip — bulk select whole waves when you unpack a shipment.",
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: Package,
    title: "What is in the package",
    body: "Accessory lists travel with each figure so your vault doubles as a completeness checklist.",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Heart,
    title: "Wishlist",
    body: "Create your Wishlist to review and update as you collect!",
  },
  {
    id: "collections",
    label: "Displays",
    icon: Layers,
    title: "Collections & displays",
    body: "Upload multi-figure shelf photos — Justice League, Teen Titans, The Dark Knight — and link figures from your vault.",
  },
  {
    id: "sync",
    label: "Cloud",
    icon: Cloud,
    title: "Cloud sync",
    body: "After you sign up, ownership, notes, and photos sync across devices with optional 2FA.",
  },
];

export function VaultPreview() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feature, setFeature] = useState<DemoFeature>("catalog");

  const selectedCard = useMemo(
    () => PREVIEW_CARDS.find((c) => c.productId === selectedId) ?? null,
    [selectedId],
  );

  const product = selectedId ? CATALOG_BY_ID[selectedId] : null;

  function openCard(card: PreviewCard) {
    setSelectedId(card.productId);
    setFeature(card.feature);
  }

  return (
    <>
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 sm:p-5 lg:p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-2 mb-3 px-1">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
              Interactive preview · DC McFarlane
            </p>
            <p className="text-sm sm:text-base font-semibold">Tap a figure to explore features</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            Demo
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {PREVIEW_CARDS.map((card) => {
            const p = CATALOG_BY_ID[card.productId];
            if (!p?.imageUrl) return null;
            return (
              <button
                key={card.productId}
                type="button"
                onClick={() => openCard(card)}
                className={cn(
                  "group text-left rounded-[var(--radius-lg)] border border-border bg-surface-2 overflow-hidden transition-colors",
                  "hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <div className="aspect-square sm:aspect-[4/3] min-h-[140px] sm:min-h-[160px] lg:min-h-[180px] bg-surface-3 relative overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-contain p-2 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-bg/90 px-2 py-0.5 text-[9px] font-semibold text-fg backdrop-blur-sm">
                    {card.badge}
                  </span>
                  <span className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-bg/90 text-fg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="p-3 sm:p-3.5 space-y-1">
                  <p className="text-xs sm:text-sm font-semibold line-clamp-2 leading-snug">
                    {p.name}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted">
                    {categoryLabel(p.category)} · {p.scale}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-subtle px-0.5">
          Real McFarlane pack shots. Click any card for a walkthrough of catalogue,
          vault tracking, accessories, and more.
        </p>
      </div>

      <Dialog
        open={!!selectedId && !!product}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[min(92dvh,860px)] overflow-y-auto p-0 gap-0">
          {product && selectedCard && (
            <>
              <div className="grid sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="relative bg-surface-2 border-b sm:border-b-0 sm:border-r border-border p-4 sm:p-5 flex items-center justify-center min-h-[220px]">
                  <img
                    src={product.imageUrl ?? ""}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[min(42dvh,360px)] w-full object-contain"
                  />
                </div>
                <div className="p-4 sm:p-5 flex flex-col">
                  <DialogHeader className="text-left space-y-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">
                        {categoryLabel(product.category)}
                      </Badge>
                      <Badge variant="outline">{product.line}</Badge>
                      {selectedCard.feature === "vaulted" && (
                        <Badge className="bg-primary text-primary-fg gap-1">
                          <Check className="h-3 w-3 stroke-[3]" />
                          In My Vault
                        </Badge>
                      )}
                      {selectedCard.feature === "wishlist" && (
                        <Badge
                          variant="outline"
                          className="border-primary/50 text-primary gap-1"
                        >
                          <Heart className="h-3 w-3 fill-current" />
                          Wishlist
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-lg sm:text-xl leading-snug">
                      {product.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted">
                      {product.character} · {product.scale}
                      {product.releaseYear ? ` · ${product.releaseYear}` : ""}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {FEATURE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = feature === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFeature(tab.id)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-fg"
                              : "border-border bg-surface text-muted hover:text-fg",
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <FeaturePanel
                    feature={feature}
                    productName={product.name}
                    accessories={product.accessories ?? []}
                    description={product.description}
                  />

                  <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-2">
                    <Button asChild className="flex-1">
                      <a href="/login?mode=signup">
                        Sign up for access
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedId(null)}
                    >
                      <X className="h-4 w-4" />
                      Close demo
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FeaturePanel({
  feature,
  productName,
  accessories,
  description,
}: {
  feature: DemoFeature;
  productName: string;
  accessories: string[];
  description: string;
}) {
  const tab = FEATURE_TABS.find((t) => t.id === feature)!;

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface-2/50 p-3.5 space-y-2.5 flex-1">
      <div className="flex items-center gap-2">
        <tab.icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{tab.title}</h4>
      </div>
      <p className="text-sm text-muted leading-relaxed">{tab.body}</p>

      {feature === "catalog" && description && (
        <p className="text-xs text-subtle leading-relaxed line-clamp-4 border-t border-border pt-2.5">
          {description}
        </p>
      )}

      {feature === "accessories" && (
        <ul className="space-y-1.5 border-t border-border pt-2.5">
          {(accessories.length ? accessories : ["Accessory list when signed in"]).map(
            (a) => (
              <li key={a} className="flex items-start gap-2 text-xs text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{a}</span>
              </li>
            ),
          )}
        </ul>
      )}

      {feature === "vaulted" && (
        <div className="border-t border-border pt-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg shadow-sm">
              <Check className="h-4 w-4 stroke-[3]" />
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold tracking-tight text-primary-fg whitespace-nowrap">
              In My Vault
            </span>
          </div>
          <p className="text-xs text-subtle leading-snug line-clamp-2 pl-0.5">
            {productName}
          </p>
        </div>
      )}

      {feature === "collections" && (
        <div className="border-t border-border pt-2.5 space-y-1.5">
          <p className="text-xs text-muted leading-relaxed">
            For example you can create a collection — “The Dark Knight shelf” —
            and post your created group photos of Joker, Batman, and others from
            The Dark Knight trilogy.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-subtle">
            <Camera className="h-3.5 w-3.5" />
            Multiple group photos per collection
          </div>
        </div>
      )}

      {feature === "sync" && (
        <ul className="space-y-1.5 border-t border-border pt-2.5 text-xs text-muted">
          <li className="flex gap-2">
            <Cloud className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            Ownership, notes, and photos on every device
          </li>
          <li className="flex gap-2">
            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            One account for DC McFarlane and future franchise vaults
          </li>
        </ul>
      )}

      {feature === "wishlist" && (
        <p className="text-xs text-subtle border-t border-border pt-2.5">
          Wishlist stays separate from In My Vault so your owned count stays
          accurate while you hunt missing pieces.
        </p>
      )}
    </div>
  );
}
