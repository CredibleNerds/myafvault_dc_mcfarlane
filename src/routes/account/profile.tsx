import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  emptyProfile,
  getMyProfile,
  saveMyProfile,
  type UserProfile,
} from "@/lib/profile";
import { AccountShell } from "@/components/account/account-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/image";
import { CATALOG } from "@/data/catalog";
import { LINES } from "@/lib/types";
import { useCatalogue } from "@/lib/store";
import { ProductImage } from "@/components/figures/product-image";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Profile · MyAFVault" }],
  }),
});

function ProfilePage() {
  const { user, isPending } = useCurrentUserState();
  const collections = useCatalogue((s) => s.collections);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [figureQuery, setFigureQuery] = useState("");
  const [pickerMode, setPickerMode] = useState<"avatar" | "favorite" | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPending || !user || user.isDevFallback) return;
    let cancelled = false;
    void getMyProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(
            emptyProfile(user.primaryEmail ?? null),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, user?.id]);

  const avatarProduct = profile.avatarProductId
    ? CATALOG.find((p) => p.id === profile.avatarProductId)
    : undefined;
  const avatarSrc =
    profile.avatarKind === "upload"
      ? profile.avatarData
      : avatarProduct?.imageUrl ?? null;

  const figureHits = useMemo(() => {
    const q = figureQuery.trim().toLowerCase();
    const list = q
      ? CATALOG.filter((p) =>
          `${p.name} ${p.character} ${p.line}`.toLowerCase().includes(q),
        )
      : CATALOG;
    return list.slice(0, 24);
  }, [figureQuery]);

  if (!isPending && (!user || user.isDevFallback)) {
    return <Navigate to="/login" />;
  }

  async function onUpload(file: File) {
    try {
      const data = await compressImage(file, 480, 0.82);
      setProfile((p) => ({
        ...p,
        avatarKind: "upload",
        avatarData: data,
        avatarProductId: null,
      }));
    } catch {
      toast.error("Could not read that photo");
    }
  }

  function pickFigure(id: string) {
    if (pickerMode === "avatar") {
      setProfile((p) => ({
        ...p,
        avatarKind: "figure",
        avatarProductId: id,
        avatarData: null,
      }));
      setPickerMode(null);
      return;
    }
    setProfile((p) => {
      if (p.favoriteProductIds.includes(id)) return p;
      if (p.favoriteProductIds.length >= 8) {
        toast.error("You can pin up to 8 favorite figures");
        return p;
      }
      return { ...p, favoriteProductIds: [...p.favoriteProductIds, id] };
    });
  }

  function toggleLine(line: string) {
    setProfile((p) => ({
      ...p,
      favoriteLines: p.favoriteLines.includes(line)
        ? p.favoriteLines.filter((l) => l !== line)
        : [...p.favoriteLines, line].slice(0, 12),
    }));
  }

  function toggleCollection(id: string) {
    setProfile((p) => ({
      ...p,
      favoriteCollectionIds: p.favoriteCollectionIds.includes(id)
        ? p.favoriteCollectionIds.filter((x) => x !== id)
        : [...p.favoriteCollectionIds, id].slice(0, 8),
    }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await saveMyProfile({ data: profile });
      setProfile(saved);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  const collectionList = Object.values(collections);

  return (
    <AccountShell title="Your collector profile" active="profile">
      {loading ? (
        <p className="text-sm text-muted flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
        </p>
      ) : (
        <form onSubmit={onSave} className="space-y-8">
          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-2xl border border-border bg-surface-2">
                  {avatarSrc ? (
                    <ProductImage
                      src={avatarSrc || ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-primary">
                      <UserRound className="h-10 w-10" />
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium">Avatar</p>
                <p className="text-xs text-muted leading-relaxed">
                  Upload a photo or use a figure from the vault as your avatar.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Upload photo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPickerMode("avatar");
                      setFigureQuery("");
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Use a figure
                  </Button>
                  {profile.avatarKind !== "none" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setProfile((p) => ({
                          ...p,
                          avatarKind: "none",
                          avatarData: null,
                          avatarProductId: null,
                        }))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
              About you
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, displayName: e.target.value }))
                  }
                  placeholder="How other collectors see you"
                  maxLength={40}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email ?? user?.primaryEmail ?? ""}
                  readOnly
                  className="bg-surface-2 text-muted"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="location">City / region</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="Optional"
                  maxLength={40}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="since">Collecting since</Label>
                <Input
                  id="since"
                  type="number"
                  inputMode="numeric"
                  min={1980}
                  max={new Date().getFullYear()}
                  value={profile.collectorSince ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      collectorSince: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  placeholder="Year"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="What you collect, grails you’re chasing…"
                  maxLength={180}
                  rows={3}
                />
                <p className="text-[11px] text-subtle">
                  {profile.bio.length}/180
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
                Favorite figures
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setPickerMode("favorite");
                  setFigureQuery("");
                }}
              >
                Add figure
              </Button>
            </div>
            {profile.favoriteProductIds.length === 0 ? (
              <p className="text-sm text-muted">
                Pin up to 8 figures that define your collection.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {profile.favoriteProductIds.map((id) => {
                  const fig = CATALOG.find((p) => p.id === id);
                  if (!fig) return null;
                  return (
                    <li
                      key={id}
                      className="relative overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface"
                    >
                      <ProductImage
                        src={fig.imageUrl || ""}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      <p className="truncate px-2 py-1.5 text-[11px] font-medium">
                        {fig.name}
                      </p>
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-bg/80 p-1 text-muted hover:text-fg"
                        onClick={() =>
                          setProfile((p) => ({
                            ...p,
                            favoriteProductIds: p.favoriteProductIds.filter(
                              (x) => x !== id,
                            ),
                          }))
                        }
                        aria-label={`Remove ${fig.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
              Favorite lines
            </h2>
            <div className="flex flex-wrap gap-2">
              {LINES.filter((l) => l !== "Custom").map((line) => {
                const on = profile.favoriteLines.includes(line);
                return (
                  <button
                    key={line}
                    type="button"
                    onClick={() => toggleLine(line)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      on
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-surface text-muted hover:text-fg",
                    )}
                  >
                    {on && <Check className="mr-1 inline h-3 w-3" />}
                    {line}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
              Favorite collections
            </h2>
            {collectionList.length === 0 ? (
              <p className="text-sm text-muted">
                Create a collection in the vault, then pin it here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {collectionList.map((c) => {
                  const on = profile.favoriteCollectionIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCollection(c.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium",
                        on
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-border bg-surface text-muted hover:text-fg",
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <Button type="submit" className="h-11 w-full sm:w-auto" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        </form>
      )}

      {pickerMode && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-bg/70 p-0 sm:place-items-center sm:p-4">
          <div className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[var(--radius-xl)] border border-border bg-surface shadow-card sm:rounded-[var(--radius-lg)]">
            <div className="border-b border-border px-4 py-3">
              <p className="font-medium">
                {pickerMode === "avatar"
                  ? "Choose a figure avatar"
                  : "Add a favorite figure"}
              </p>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input
                  value={figureQuery}
                  onChange={(e) => setFigureQuery(e.target.value)}
                  placeholder="Search the vault…"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {figureHits.map((fig) => (
                <li key={fig.id}>
                  <button
                    type="button"
                    onClick={() => pickFigure(fig.id)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-left hover:bg-surface-2"
                  >
                    <ProductImage
                      src={fig.imageUrl || ""}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {fig.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {fig.line}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setPickerMode(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
