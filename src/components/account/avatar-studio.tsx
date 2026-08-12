import { useMemo, useRef, useState, type ReactNode } from "react";

import { Camera, Check, Search, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CollectorAvatar } from "@/components/account/collector-avatar";
import { compressImage } from "@/lib/image";
import { CATALOG } from "@/data/catalog";
import {
  AVATAR_BG,
  AVATAR_FRAMES,
  type AvatarBadge,
  type AvatarConfig,
  type AvatarShape,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AvatarStudio({
  config,
  uploadSrc,
  name,
  onChange,
  onUpload,
  onClose,
}: {
  config: AvatarConfig;
  uploadSrc: string | null;
  name: string;
  onChange: (next: AvatarConfig) => void;
  onUpload: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? CATALOG.filter((p) =>
          `${p.name} ${p.character} ${p.line}`.toLowerCase().includes(q),
        )
      : CATALOG;
    return list.slice(0, 20);
  }, [query]);

  function patch(partial: Partial<AvatarConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-bg/70 sm:place-items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-border bg-surface shadow-card sm:rounded-[var(--radius-lg)]">
        <div className="border-b border-border px-4 py-3">
          <p className="font-medium">Customize avatar</p>
          <p className="text-xs text-muted">
            Build a collector avatar from a figure, photo, or initials.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div className="flex justify-center">
            <CollectorAvatar
              config={config}
              uploadSrc={uploadSrc}
              name={name}
              size={140}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SourceBtn
              active={config.source === "figure"}
              onClick={() => patch({ source: "figure" })}
              icon={<Sparkles className="h-4 w-4" />}
              label="Figure"
            />
            <SourceBtn
              active={config.source === "upload"}
              onClick={() => fileRef.current?.click()}
              icon={<Camera className="h-4 w-4" />}
              label="Photo"
            />
            <SourceBtn
              active={config.source === "initials"}
              onClick={() =>
                patch({ source: "initials", productId: null })
              }
              icon={<Type className="h-4 w-4" />}
              label="Initials"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void compressImage(file, 480, 0.82)
                .then((data) => {
                  onUpload(data);
                  patch({ source: "upload", productId: null });
                })
                .catch(() => toast.error("Could not read that photo"));
              e.target.value = "";
            }}
          />

          {config.source === "figure" && (
            <div className="space-y-2">
              <Label>Choose a figure</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Batman, Darkseid…"
                  className="pl-9"
                />
              </div>
              <ul className="grid max-h-40 grid-cols-5 gap-1.5 overflow-y-auto">
                {hits.map((fig) => (
                  <li key={fig.id}>
                    <button
                      type="button"
                      onClick={() =>
                        patch({ source: "figure", productId: fig.id })
                      }
                      className={cn(
                        "overflow-hidden rounded-[var(--radius-xs)] border",
                        config.productId === fig.id
                          ? "border-primary"
                          : "border-border",
                      )}
                      title={fig.name}
                    >
                      <img
                        src={fig.imageUrl || ""}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(config.source === "figure" || config.source === "upload") && (
            <div className="grid grid-cols-3 gap-3">
              <Slider
                label="Zoom"
                min={1}
                max={2.6}
                step={0.05}
                value={config.zoom}
                onChange={(zoom) => patch({ zoom })}
              />
              <Slider
                label="Left / right"
                min={-40}
                max={40}
                step={1}
                value={config.offsetX}
                onChange={(offsetX) => patch({ offsetX })}
              />
              <Slider
                label="Up / down"
                min={-40}
                max={40}
                step={1}
                value={config.offsetY}
                onChange={(offsetY) => patch({ offsetY })}
              />
            </div>
          )}

          <fieldset className="space-y-2">
            <Label>Background</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_BG.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => patch({ bg: opt.value })}
                  className={cn(
                    "h-8 w-8 rounded-full border-2",
                    opt.className,
                    config.bg === opt.value
                      ? "border-fg"
                      : "border-border",
                  )}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Shape</Label>
            <div className="flex gap-2">
              {(["circle", "rounded"] as AvatarShape[]).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => patch({ shape })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium capitalize",
                    config.shape === shape
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted",
                  )}
                >
                  {shape}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Frame</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_FRAMES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patch({ frame: opt.value })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    config.frame === opt.value
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <Label>Badge</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["none", "None"],
                  ["vault", "In My Vault"],
                  ["star", "Star"],
                  ["initials", "Initial"],
                ] as [AvatarBadge, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => patch({ badge: value })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    config.badge === value
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="border-t border-border p-3">
          <Button type="button" className="w-full" onClick={onClose}>
            <Check className="h-4 w-4" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;

  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border py-2.5 text-xs font-medium",
        active
          ? "border-primary bg-primary/10 text-fg"
          : "border-border text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="grid gap-1 text-[11px] text-muted">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}
