-- Tokens for third-party integrations the server renews itself (Instagram
-- long-lived tokens expire after 60 days and must be refreshed). Server-only:
-- RLS on with no policies and no grants for browser roles.
create table if not exists public.integration_tokens (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.integration_tokens enable row level security;
revoke all on public.integration_tokens from anon, authenticated, public;
grant all on public.integration_tokens to service_role;
