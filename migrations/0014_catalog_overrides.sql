-- Admin-authored corrections to master catalogue listings.
-- Applied for every user on top of catalog.json.
create table if not exists catalog_overrides (
  product_id text primary key,
  patch jsonb not null default '{}'::jsonb,
  hidden boolean not null default false,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists catalog_overrides_updated_at_idx
  on catalog_overrides (updated_at desc);
