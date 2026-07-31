-- Cloud vault for user collection overlays (owned/wishlist/photos/notes).
-- One row per signed-in user; entries stored as a JSON object keyed by productId.
create table if not exists collection_vaults (
  user_id    text primary key,
  entries    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists collection_vaults_updated_at_idx
  on collection_vaults (updated_at desc);
