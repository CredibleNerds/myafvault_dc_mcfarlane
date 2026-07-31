import {
  Download,
  Grid3X3,
  List,
  Plus,
  Search,
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
import { CATEGORIES, LINES } from "@/lib/types";
import type { ProductCategory } from "@/lib/types";
import type { ScopeFilter, SortKey, ViewMode } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  categoryFilter: ProductCategory | "all";
  onCategory: (v: ProductCategory | "all") => void;
  lineFilter: string;
  onLine: (v: string) => void;
  scopeFilter: ScopeFilter;
  onScope: (v: ScopeFilter) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  categoryCounts: Record<string, number>;
  onAddCustom: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function Toolbar({
  search,
  onSearch,
  categoryFilter,
  onCategory,
  lineFilter,
  onLine,
  scopeFilter,
  onScope,
  sort,
  onSort,
  view,
  onView,
  categoryCounts,
  onAddCustom,
  onExport,
  onImport,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {CATEGORIES.map((c) => {
          const count =
            c.value === "all"
              ? categoryCounts.all
              : (categoryCounts[c.value] ?? 0);
          const active = categoryFilter === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onCategory(c.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap",
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, character, accessories, SKU…"
            className="pl-9"
            aria-label="Search catalog"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[var(--radius-sm)] border border-border bg-surface p-0.5">
            <Button
              type="button"
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onView("grid")}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => onView("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onAddCustom} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            <span>Add custom</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={scopeFilter}
          onValueChange={(v) => onScope(v as ScopeFilter)}
        >
          <SelectTrigger className="w-[min(100%,150px)] sm:w-[160px]">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Full catalog</SelectItem>
            <SelectItem value="owned">Owned only</SelectItem>
            <SelectItem value="wishlist">Wishlist</SelectItem>
            <SelectItem value="unowned">Not owned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={lineFilter} onValueChange={onLine}>
          <SelectTrigger className="w-[min(100%,150px)] sm:w-[170px]">
            <SelectValue placeholder="Line" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All lines</SelectItem>
            {LINES.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
          <SelectTrigger className="w-[min(100%,160px)] sm:w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year-desc">Year (newest)</SelectItem>
            <SelectItem value="year-asc">Year (oldest)</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
            <SelectItem value="character-asc">Character</SelectItem>
            <SelectItem value="owned-first">Owned first</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onImport}
            aria-label="Import collection"
            title="Import collection JSON"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onExport}
            aria-label="Export collection"
            title="Export collection JSON"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
