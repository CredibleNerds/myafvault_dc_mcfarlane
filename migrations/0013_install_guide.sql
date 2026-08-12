alter table user_profiles
  add column if not exists seen_install_guide boolean not null default false;
