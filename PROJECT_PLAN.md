# PakFrag marketplace — project plan

## Background

- AVANX runs the Pakistan Fragrance Community (PFC), a 160,000+ member Facebook
  group, since 2016. Real transactions have historically happened inside
  Facebook posts, which don't support real search — this project moves that
  activity onto pakfrag.com.
- Sellers register with AVANX, pay a manual quarterly subscription (existing
  sellers: 4-month cycle, new sellers: 3-month cycle), and sell BNIB (brand new
  in box), Testers, and Vials/Decants.
- Partials (opened/used bottles at varying fill levels and conditions) are a
  separate category, sellable by both subscribed Sellers and unsubscribed
  Members.
- There is no live Pakistani payment gateway today — real transactions happen
  off-platform (typically WhatsApp) after buyer and seller connect via the site.

## Current state (schema audit, September 2026)

A schema audit of the `marketplace-v2` branch found that most of what this
document originally described as future work is **already built and live**,
from earlier work on this same project. Status per table, traced through actual
API routes and pages:

**Fully built, v1-aligned, already shipped:**
- `listings` — public browse pages, seller submission flow, admin
  approve/reject/sold/expire. WhatsApp-based, no payment fields.
- `order_requests` — a "request a fragrance" concierge flow, admin-managed.
- `iso_requests` — live and in the main nav today (see Decision 1 below).
- `transactions` / `transaction_items` — logs deals that happened off-platform,
  feeding seller ratings. Not a charge — a record.
- `disputes` — buyer-initiated, admin resolve/escalate, can downgrade a
  seller's verification tier.
- `seller_trust_scores`, `seller_transaction_stats`, `city_transaction_demand`
  — working DB views feeding public seller/city stats pages.
- `fragrances` / `fragrance_houses` / `product_variants` — the catalog spine
  already exists; this is the "master product" table the original plan called
  for building from scratch. **Extend this, don't recreate it.**

**Partially built:**
- `seller_inventory` — built, but gated behind a pilot flag
  (`sellers.inventory_pilot_enabled`). Structured stock (`stock_qty`,
  `reserved_qty`) — the substrate for in-platform checkout.
- `seller_tier_requests` — written by the L2 verification form, but nothing
  reads it back yet. Needs a small admin view to close the loop.

**Schema + dev-only, no real payment behind it:**
- `checkout_orders` (renamed from `orders`, Decision 3) — assumes
  platform-mediated payment (`pending_payment`/`paid`, `payment_provider`,
  `paid_at`). Only referenced by an admin dev-simulation route with a comment
  noting it stands in for a real payment webhook.
- `reserve_seller_inventory` / `commit_reservation` (Postgres RPCs) — a
  reserve-then-commit-on-payment flow, currently only called by that dev
  simulation.
- `lib/inventory-routing.js` — scores sellers by price/trust/tier/stock to
  auto-pick a match for a buyer. Built, not yet wired to a real user flow.

This means Phase 1 through most of Phase 3 below are **already done**. The
remaining work is smaller than the original plan assumed, concentrated in two
places: a few product decisions that the existing code had implicitly already
made, and Phase 4 (real payment integration), which has a genuine head start.

## Decisions made in light of the audit

1. **ISO is currently a primary nav feature, not a fallback.** Decision: demote
   it to fallback-only — remove/de-emphasize in the main nav, and instead
   surface it as a prompt when a search returns no listings ("Nothing found —
   post an ISO request instead"). This is a UI/routing change, not a schema
   change; the underlying `iso_requests` flow stays as-is.
2. **Checkout model: offer both, buyer choice is the default.** `lib/inventory-routing.js`
   already implements platform auto-assignment; that becomes an optional
   "Quick match" fast path rather than the only path. Default experience is
   browsing `seller_inventory`/`listings` and picking a seller directly. Both
   paths converge on the same `reserve_seller_inventory` → `commit_reservation`
   flow — the only difference is how a specific inventory row gets chosen
   before that call.
3. **Naming collision fixed:** `orders` (in-platform checkout, dev-only) and
   `order_requests` (WhatsApp concierge, live) were easy to confuse. Since
   `orders` had zero rows, it was renamed to `checkout_orders` (table, its
   indexes/constraints, and the owner-read RLS policy). The
   `reserve_seller_inventory` / `commit_reservation` RPCs never referenced it by
   name, and the `order_line_items` FK followed the rename automatically.

## Product decisions (recap)

- Search-first discovery; ISO/quote is a fallback (see Decision 1).
- Fragrance + variant catalog groups BNIB / Tester / Partial listings
  underneath it via the existing `fragrances`/`product_variants` tables.
- Listing cards show source: verified Seller vs. unverified Member.
- Platform accountability (ratings, disputes) covers Sellers only — already
  reflected in how `disputes` is scoped to logged `transactions`.
- Sellers and Members sign up through the existing Google OAuth flow;
  "becoming a Seller" is an admin action on `sellers`/`subscriptions` — no new
  auth system.
- Subscription-only revenue in v1; the checkout/escrow layer (Phase 4) is
  additive, not a replacement, and turns on only when a real payment gateway
  replaces the dev simulation.

## Phase 0 — Cold-start catalog seeding

**Goal:** make sure the existing `fragrances` catalog and current `listings`
actually reflect real, current seller inventory before any public push.

- Use Claude to extract structured listings (product, brand, size, price,
  condition, seller) from existing seller posts, price lists, or screenshots,
  matched against the existing `fragrances`/`product_variants` catalog.
- **Every AI-extracted batch goes through human review before publishing.**
- White-glove onboard the most active sellers whose current listings are stale
  or missing, rather than waiting for self-service updates.

## Phase 1–3 — Mostly shipped; remaining gaps

- Apply Decision 1 (demote ISO from main nav to fallback prompt).
- Close the `seller_tier_requests` loop with a small admin read view.
- Confirm search quality against the real catalog is good enough for public
  traffic before any wider announcement — this is now a content/tuning task,
  not a build task.
- Have a basic Terms of Service and privacy note in place before wider public
  push, if not already present — should state plainly that platform
  accountability covers Sellers only, not Member-to-Member partial deals.

## Phase 4 — Real payment integration (has a head start)

- ~~Rename `orders` → `checkout_orders` (Decision 3)~~ — done.
- Replace `dev-simulate-checkout.js` with a real State Bank of
  Pakistan–regulated payment provider (e.g. PayFast, Safepay) or unified
  aggregator (e.g. Simpaisa, Rapid Gateway) calling `commit_reservation` from
  an actual webhook instead of the dev harness.
- Build the buyer-facing checkout UI: default browse-and-choose against
  `seller_inventory`, with "Quick match" as the optional auto-assign path
  (Decision 2) using the existing `lib/inventory-routing.js` scoring.
- Turn on `sellers.inventory_pilot_enabled` for a small test group before a
  full rollout — the pilot flag already exists for exactly this.
- Start with higher-value BNIB listings only; this stays additive to the
  subscription model, launching once trust and transaction volume justify the
  added complexity (refunds, disputes, PSP onboarding/KYC).

## Open inputs still needed

- Who is building this, and on what timeline/budget?
- Confirm the ISO nav-demotion UX (Decision 1) doesn't break any existing
  user habits — some buyers may already rely on ISO as their main entry point
  given it's been live and prominent.

## Risks worth tracking

- **Off-platform trust exposure (v1):** already mitigated in code via
  `transactions`/`disputes`/`seller_trust_scores` — keep these central to the
  experience rather than treating them as an add-on.
- **Checkout complexity (v2):** two fulfillment paths (browse vs. quick-match)
  converging on one reservation system is elegant but needs solid test
  coverage before real money moves through it — this is the highest-stakes
  code in the whole project.
- **Scope discipline:** it's tempting to rush the payment integration now that
  so much scaffolding already exists — resist connecting a real PSP before the
  naming collision (Decision 3) and reservation-flow testing are done.
