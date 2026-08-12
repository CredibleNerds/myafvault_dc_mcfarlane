create table if not exists forum_members (
  user_id text primary key,
  joined_at timestamptz not null default now()
);

create table if not exists forum_posts (
  id text primary key,
  user_id text not null,
  kind text not null default 'photo',
  title text not null,
  body text not null default '',
  image_data text,
  created_at timestamptz not null default now()
);

create index if not exists forum_posts_created_idx
  on forum_posts (created_at desc);

create table if not exists forum_comments (
  id text primary key,
  post_id text not null references forum_posts(id) on delete cascade,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists forum_comments_post_idx
  on forum_comments (post_id, created_at);

create table if not exists forum_likes (
  post_id text not null references forum_posts(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
