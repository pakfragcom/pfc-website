-- Phase 3 checkout: PFC is the merchant, so a shop order line often has no
-- seller until the admin sources it, and commission/payout are filled in by
-- the admin later. Additive and safe: relaxes NOT NULL, adds defaults, adds
-- one setting row. No existing rows (checkout_orders is empty).
alter table public.order_line_items alter column seller_id drop not null;
alter table public.order_line_items alter column commission_pct set default 0;
alter table public.order_line_items alter column commission_pkr set default 0;
alter table public.order_line_items alter column seller_payout_pkr set default 0;

-- Flat delivery fee in PKR added to pay-now orders ('0' = free / included).
insert into public.shop_settings (key, value) values ('shipping_fee_pkr', '0')
on conflict (key) do nothing;

-- Lookups the order pages use.
create index if not exists checkout_orders_buyer_created_idx
  on public.checkout_orders (buyer_id, created_at desc);
