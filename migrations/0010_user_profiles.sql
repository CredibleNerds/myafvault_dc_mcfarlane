-- Per-account public-facing profile. Never shared across user_id.
create table if not exists user_profiles (
  user_id text primary key,
  display_name text,
  bio text,
  location text,
  collector_since integer,
  avatar_kind text not null default 'none',
  avatar_data text,
  avatar_product_id text,
  favorite_product_ids jsonb not null default '[]'::jsonb,
  favorite_lines jsonb not null default '[]'::jsonb,
  favorite_collection_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
