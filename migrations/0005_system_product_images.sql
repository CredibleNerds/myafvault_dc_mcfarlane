-- Global per-product cover images set by vault admins.
-- All users see these as the default listing photo unless they set a personal cover.
create table if not exists system_product_images (
  product_id text primary key,
  image_url text not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists system_product_images_updated_at_idx
  on system_product_images (updated_at desc);
