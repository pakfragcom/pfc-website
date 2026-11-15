-- Phase 2, part 2: the two statements that are not purely additive.
-- (Kept separate so part 1 can be applied even where DROP/REVOKE is gated.)

-- Order status: add the quote step and the fulfilment steps. The legacy
-- values (processing, partially_fulfilled, fulfilled, refunded) stay valid
-- because the admin dev-simulate route still writes them.
alter table public.checkout_orders drop constraint if exists checkout_orders_status_check;
alter table public.checkout_orders add constraint checkout_orders_status_check check (
  status in (
    'awaiting_quote', 'quoted', 'pending_payment', 'paid',
    'sent_to_seller', 'shipped', 'delivered', 'cancelled',
    'processing', 'partially_fulfilled', 'fulfilled', 'refunded'
  )
);

-- Same rule as the rest of the schema: no browser role writes any table
-- directly; every write goes through a server route with the service role.
revoke insert, update, delete on
  public.shop_products, public.customer_addresses, public.payment_receipts, public.shop_settings
from anon, authenticated;
