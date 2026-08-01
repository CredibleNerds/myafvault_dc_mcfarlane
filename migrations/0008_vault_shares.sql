-- Public "In My Vault" collection share links (owned figures snapshot).
create table if not exists vault_shares (
  token text primary key,
  user_id text not null,
  title text not null default 'My Vault',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists vault_shares_user_id_idx
  on vault_shares (user_id);

create index if not exists vault_shares_active_idx
  on vault_shares (user_id)
  where revoked_at is null;
