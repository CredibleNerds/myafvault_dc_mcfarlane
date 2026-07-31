-- Authenticator (TOTP) two-factor auth for vault accounts.
create table if not exists two_factor_settings (
  user_id       text primary key,
  totp_secret   text not null,
  enabled       boolean not null default false,
  backup_codes  jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- Session unlocks after a successful 2FA challenge (scoped to Better Auth session).
create table if not exists two_factor_unlocks (
  user_id      text not null,
  session_key  text not null,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, session_key)
);

create index if not exists two_factor_unlocks_expires_idx
  on two_factor_unlocks (expires_at);
