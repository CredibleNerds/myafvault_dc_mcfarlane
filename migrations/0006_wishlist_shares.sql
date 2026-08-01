-- Public wishlist share links (tokenized snapshot of product cards only).
create table if not exists wishlist_shares (
  token text primary key,
  user_id text not null,
  title text not null default 'My Wishlist',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists wishlist_shares_user_id_idx
  on wishlist_shares (user_id);

create index if not exists wishlist_shares_active_idx
  on wishlist_shares (user_id)
  where revoked_at is null;
