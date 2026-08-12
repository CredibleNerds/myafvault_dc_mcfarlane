import { OWNERSHIP } from "@/lib/ownership-copy";
import {
  Download,
  Grid3X3,
  List,
  Plus,
  Search,
  Share2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { CATEGORIES, LINES } from "@/lib/types";
import type { ProductCategory } from "@/lib/types";
import type { ScopeFilter, SortKey, ViewMode } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  categoryFilters: ProductCategory[];
  onToggleCategory: (v: ProductCategory | "all") => void;
  lineFilters: string[];
  onToggleLine: (v: string) => void;
  onClearLines: () => void;
  scopeFilters: ScopeFilter[];
  onToggleScope: (v: ScopeFilter) => void;
  onClearScopes: () => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  categoryCounts: Record<string, number>;
  wishlistCount: number;
  ownedCount: number;
  onShareWishlist: () => void;
  onShareVault: () => void;
  onAddCustom: () => void;
  onExport: () => void;
  onImport: () => void;
}

const SCOPE_OPTIONS: { value: ScopeFilter; label: string }[] = [
  { value: "owned", label: OWNERSHIP.filterOnly },
  { value: "wishlist", label: "Wishlist" },
  { value: "custom", label: "My listings" },
  { value: "unowned", label: OWNERSHIP.filterNot },
];

export function Toolbar({
  search,
  onSearch,
  categoryFilters,
  onToggleCategory,
  lineFilters,
  onToggleLine,
  onClearLines,
  scopeFilters,
  onToggleScope,
  onClearScopes,
  sort,
  onSort,
  view,
  onView,
  categoryCounts,
  wishlistCount,
  ownedCount,
  onShareWishlist,
  onShareVault,
  onAddCustom,
  onExport,
  onImport,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3.5 sm:gap-3">
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none touch-pan-x">
        {CATEGORIES.map((c) => {
          const count =
            c.value === "all"
              ? categoryCounts.all
              : (categoryCounts[c.value] ?? 0);
          const active =
            c.value === "all"
              ? categoryFilters.length === 0
              : categoryFilters.includes(c.value);
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onToggleCategory(c.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap min-h-10",
                active
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {c.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  active ? "opacity-80" : "text-subtle",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, character, accessories, SKU…"
            className="pl-9 h-11"
            aria-label="Search catalog"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[var(--radius-sm)] border border-border bg-surface p-0.5">
            <Button
              type="button"
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onView("grid")}
              aria-label="Grid view"
              className="h-10 w-10"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onView("list")}
              aria-label="List view"
              className="h-10 w-10"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={onAddCustom}
            className="flex-1 h-10 sm:flex-none sm:h-10"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">My listing</span>
            <span className="hidden sm:inline">Create listing</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <MultiSelect
          label="Full catalog"
          values={scopeFilters}
          options={SCOPE_OPTIONS}
          onToggle={onToggleScope}
          onClear={onClearScopes}
          className="w-full sm:w-[180px]"
        />

        <MultiSelect
          label="All lines"
          values={lineFilters}
          options={LINES.map((l) => ({ value: l, label: l }))}
          onToggle={onToggleLine}
          onClear={onClearLines}
          className="w-full sm:w-[180px]"
        />

        <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
          <SelectTrigger className="col-span-2 w-full h-10 sm:col-auto sm:w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year-desc">Newest first</SelectItem>
            <SelectItem value="year-asc">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
            <SelectItem value="character-asc">Character</SelectItem>
            <SelectItem value="owned-first">{OWNERSHIP.sortFirst}</SelectItem>
          </SelectContent>
        </Select>

        <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:ml-auto sm:col-auto">
          <Button
            type="button"
            variant={scopeFilters.includes("owned") ? "secondary" : "outline"}
            size="sm"
            onClick={onShareVault}
            disabled={ownedCount === 0}
            className={
              ownedCount > 0
                ? "text-primary hover:text-primary gap-1.5 h-9 flex-1 sm:flex-none"
                : "gap-1.5 h-9 flex-1 sm:flex-none"
            }
            aria-label="Share my vault"
            title={
              ownedCount === 0
                ? `Mark figures ${OWNERSHIP.status} to share`
                : "Share My Vault collection link"
            }
          >
            <Share2 className="h-4 w-4" />
            <span>Vault</span>
          </Button>
          <Button
            type="button"
            variant={scopeFilters.includes("wishlist") ? "secondary" : "outline"}
            size="sm"
            onClick={onShareWishlist}
            disabled={wishlistCount === 0}
            className={
              wishlistCount > 0
                ? "text-wishlist hover:text-wishlist gap-1.5 h-9 flex-1 sm:flex-none"
                : "gap-1.5 h-9 flex-1 sm:flex-none"
            }
            aria-label="Share wishlist"
            title={
              wishlistCount === 0
                ? "Add figures to your wishlist to share"
                : "Share wishlist link"
            }
          >
            <Share2 className="h-4 w-4" />
            <span>Wish</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onImport}
            aria-label="Import collection"
            title="Import collection JSON"
            className="h-9 w-9"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onExport}
            aria-label="Export collection"
            title="Export collection JSON"
            className="h-9 w-9"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
