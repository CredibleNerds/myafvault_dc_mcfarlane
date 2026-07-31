-- User-built display groups (Justice League shelf photos, movie casts, etc.)
alter table collection_vaults
  add column if not exists collections jsonb not null default '{}'::jsonb;
