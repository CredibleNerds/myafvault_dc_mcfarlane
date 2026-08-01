-- Tokenized public shares for single vault items and user collections.
create table if not exists public_shares (
  token text primary key,
  user_id text not null,
  kind text not null,
  source_id text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint public_shares_kind_check check (kind in ('item', 'collection'))
);

create index if not exists public_shares_user_id_idx
  on public_shares (user_id);

create index if not exists public_shares_lookup_idx
  on public_shares (user_id, kind, source_id)
  where revoked_at is null;
