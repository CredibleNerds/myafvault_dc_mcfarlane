alter table user_profiles
  add column if not exists avatar_config jsonb not null default '{}'::jsonb;
