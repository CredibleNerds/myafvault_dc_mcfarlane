-- One-time Stripe payment unlocks vault access for a user.
create table if not exists vault_access (
  user_id text primary key,
  status text not null default 'active',
  source text not null default 'stripe',
  stripe_session_id text unique,
  stripe_customer_id text,
  stripe_payment_intent text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists vault_access_session_idx
  on vault_access (stripe_session_id)
  where stripe_session_id is not null;

-- Existing accounts keep access after billing goes live.
insert into vault_access (user_id, status, source)
select id, 'active', 'grandfathered'
from "user"
on conflict (user_id) do nothing;
