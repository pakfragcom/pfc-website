-- Phase 2: shop data model (dropship, advance bank transfer). Additive only;
-- the constraint swap and grant revokes live in 20261116_02.
--
-- Model in one paragraph: `fragrances` + `product_variants` stay the catalog
-- spine (a decant is a variant with kind = 'decant'). `shop_products` is what
-- PFC itself sells: one row per variant with PFC's customer price and a manual
-- in_stock / on_request flag, plus internal source-seller fields so a future
-- seller dashboard can point a row at `seller_inventory` without a rewrite.
-- `checkout_orders` gains the quote step (awaiting_quote -> quoted) in front of
-- pending_payment, and fulfilment timestamps. Receipts are a separate table
-- in a private bucket; bank details and policies are admin-edited rows in
-- `shop_settings`, never code.

-- 1. Variant kind: bottle / decant / tester
alter table public.product_variants
  add column if not exists kind text not null default 'bottle'
  check (kind in ('bottle', 'decant', 'tester'));

-- 2. Saved customer addresses (created before checkout_orders references it)
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses (user_id);
alter table public.customer_addresses enable row level security;
create policy customer_addresses_owner_read on public.customer_addresses
  for select using (auth.uid() = user_id);
create or replace trigger customer_addresses_updated_at
  before update on public.customer_addresses
  for each row execute function public.update_updated_at();

-- 3. What PFC sells
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  fragrance_id uuid not null references public.fragrances(id),
  variant_id uuid not null references public.product_variants(id),
  price_pkr integer not null check (price_pkr > 0),
  availability text not null default 'on_request'
    check (availability in ('in_stock', 'on_request')),
  -- internal: where PFC sources this item (dropship)
  source_seller_id uuid references public.sellers(id),
  seller_cost_pkr integer check (seller_cost_pkr is null or seller_cost_pkr > 0),
  source_inventory_id uuid references public.seller_inventory(id),
  authenticity_badge text
    check (authenticity_badge is null or authenticity_badge in ('verified_authentic', 'sealed_batch_checked')),
  images text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id)
);
create index if not exists shop_products_active_idx on public.shop_products (is_active, sort_order);
create index if not exists shop_products_fragrance_idx on public.shop_products (fragrance_id);
alter table public.shop_products enable row level security;
create policy shop_products_public_read on public.shop_products
  for select using (is_active = true);
create or replace trigger shop_products_updated_at
  before update on public.shop_products
  for each row execute function public.update_updated_at();

-- 4. Orders: quote step, customer snapshot, fulfilment timestamps
alter table public.checkout_orders
  add column if not exists order_number text unique,
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists customer_note text,
  add column if not exists address_id uuid references public.customer_addresses(id),
  add column if not exists quote_note text,
  add column if not exists quoted_total_pkr integer check (quoted_total_pkr is null or quoted_total_pkr > 0),
  add column if not exists quoted_at timestamptz,
  add column if not exists sent_to_seller_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists tracking_ref text;
create index if not exists checkout_orders_status_idx on public.checkout_orders (status, created_at desc);

-- 5. Line items point at the shop product they were bought as
alter table public.order_line_items
  add column if not exists shop_product_id uuid references public.shop_products(id);

-- 6. Payment receipts (file lives in the private order-receipts bucket)
create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.checkout_orders(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  storage_path text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  reference text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists payment_receipts_order_idx on public.payment_receipts (order_id);
alter table public.payment_receipts enable row level security;
create policy payment_receipts_owner_read on public.payment_receipts
  for select using (
    exists (select 1 from public.checkout_orders o where o.id = order_id and o.buyer_id = auth.uid())
  );
insert into storage.buckets (id, name, public)
  values ('order-receipts', 'order-receipts', false)
  on conflict (id) do nothing;

-- 7. Verified-purchase reviews
alter table public.reviews
  add column if not exists order_id uuid references public.checkout_orders(id);

-- 8. Admin-edited shop settings. RLS on with no policies: browser roles can't
--    read or write; the server reads them with the service role.
create table if not exists public.shop_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.shop_settings enable row level security;
insert into public.shop_settings (key, value) values
  ('shop_enabled', 'false'),
  ('bank_details', ''),
  ('shipping_policy', ''),
  ('cancellation_policy', ''),
  ('order_contact_whatsapp', '')
on conflict (key) do nothing;
