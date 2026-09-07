# PakFrag marketplace — project plan

## Background

- AVANX runs the Pakistan Fragrance Community (PFC), a 160,000+ member Facebook
  group, since 2016. pakfrag.com is the associated website but isn't where real
  transactions happen today — sellers and buyers connect and quote each other
  inside Facebook posts, which don't support real search.
- Sellers register with AVANX, pay a manual quarterly subscription (existing
  sellers: 4-month cycle, new sellers: 3-month cycle), and sell BNIB (brand new in
  box), Testers, and Vials/Decants.
- Partials (opened/used bottles at varying fill levels and conditions) are a
  separate category, sellable by both subscribed Sellers and unsubscribed Members.
- There is no Pakistani payment gateway integrated today, so all transactions
  happen off-platform (typically WhatsApp) after buyer and seller connect.

## Product decisions (recap — see CLAUDE.md for the short version)

- Search-first discovery; ISO/quote is a fallback, not the primary flow.
- One master product groups BNIB / Tester / Partial listings underneath it.
- Listing cards show source: verified Seller vs. unverified Member.
- Platform accountability (ratings, disputes) covers Sellers only.
- **Superseded:** manual account provisioning was the original plan before the
  existing codebase's auth system was visible. Sellers and Members now sign up
  through the site's existing Google OAuth flow, and "becoming a Seller" is an
  admin action on the existing `sellers`/`subscriptions` tables — see
  `CLAUDE.md` § Marketplace rebuild for the corrected version.
- Subscription-only revenue in v1; escrow/commission is a v2 addition, layered on
  top of subscriptions, not a replacement for them.

## Data model (core entities)

- **Sellers** — the existing `sellers` table already covers this: status
  (`active`/`grace`/`expired`/`pending`), `user_id` link to the OAuth account.
  Likely just needs new columns for cycle length (3 vs. 4 month) and a
  verification badge flag rather than a new table.
- **Members** — already covered by `profiles.role = 'member'`. No new table
  needed; a Member is simply any authenticated user without an active `sellers`
  row.
- **Master Products** — check for an existing fragrance/product catalog table
  before building this (see CLAUDE.md note re: `fragrances.js`). If one exists,
  extend it; if not, this is the one genuinely new core table.
- **Listings** — a Seller's or Member's specific instance of a master product:
  price, condition, photos, listing type (BNIB / Tester / Partial), stock status.
- **Partial attributes** — fill %, seal/box condition, batch visibility, lister
  type (Seller or Member).
- **ISO Requests** (v1.5) — buyer posts what they want when search turns up
  nothing.
- **Quotes** (v1.5) — Seller responses to an ISO request.
- **Subscriptions** — manually tracked per Seller; drives listing visibility.

## Phase 0 — Cold-start catalog seeding

**Goal:** launch with real inventory, not an empty marketplace.

- Seed the master product catalog first, using your own knowledge of the
  200–500 fragrances that account for most PFC volume, before any seller touches
  the system.
- Use Claude to extract structured listings (product, brand, size, price,
  condition, seller) from existing seller posts, price lists, or screenshots.
- **Every AI-extracted batch goes through human review before publishing.**
  Never auto-publish extracted prices or product matches directly — a misread
  price or wrong product match at launch is exactly the kind of error that costs
  early trust.
- White-glove onboard your 15–20 most active sellers: have your team enter their
  current inventory for them once, rather than asking for self-service data entry
  up front.

## Phase 1 — Core platform build

- Extend `pfc-mgmt` with a `can_manage_marketplace` permission (same pattern as
  `can_manage_sellers`) for subscription/expiry tracking and auto-hiding
  listings when a Seller's subscription lapses — not a new admin portal.
- Auth: none needed — reuses existing OAuth. See CLAUDE.md correction.
- Master product catalog with fuzzy-match-before-create (suggest existing matches
  before allowing a new entry) and an admin merge tool for fixing duplicates after
  the fact.
- Search across the catalog; product pages grouping BNIB / Tester / Partial
  listings.
- WhatsApp-connect call-to-action on each listing (no in-platform checkout in v1).
- Seller verification badges vs. "Member listing — deal directly" labeling.

## Phase 2 — Soft launch

- Launch quietly to the seeded, white-glove-onboarded sellers only.
- Validate search quality and onboarding friction before any public
  announcement — an empty or broken-feeling catalog at public launch is hard to
  recover from.

## Phase 3 — Public launch + ISO fallback

- Open to the wider PFC community once search reliably surfaces real inventory.
- Add the ISO/quote flow as the fallback for items nobody has listed yet.
- Add Seller ratings/reviews and a buyer reporting channel.
- Have a basic Terms of Service and privacy note in place before this point —
  it should state plainly that platform accountability covers Sellers only, not
  Member-to-Member partial deals.

## Phase 4 — Escrow and commission (v2)

- Integrate a State Bank of Pakistan–regulated payment provider (e.g. PayFast,
  Safepay) or a unified aggregator (e.g. Simpaisa, Rapid Gateway) that bundles
  JazzCash, Easypaisa, and cards under one integration.
- Build an optional "Fulfilled" checkout: buyer pays through the platform,
  platform holds funds, releases to Seller minus commission after delivery is
  confirmed (or after a no-dispute window).
- Start with higher-value BNIB listings only — this is additive to the
  subscription model, not a replacement, and it should launch only once trust and
  transaction volume justify the added complexity (refunds, disputes, PSP
  onboarding/KYC).

## Open inputs still needed

- Who is building this, and on what timeline/budget? This determines whether the
  phase sequence above is a matter of weeks or several months.
- Confirm whether this ships as new routes on the existing pakfrag.com domain or
  a subdomain — recommendation is new routes on the same app (see CLAUDE.md).
- Initial seed list of top 200–500 products for Phase 0.

## Risks worth tracking

- **Cold-start:** a marketplace with search but no real listings is worse than
  Facebook. Don't publicly launch before Phase 0/2 are genuinely done.
- **Off-platform trust exposure:** no escrow in v1 means transactions happen
  outside platform visibility. Ratings and a reporting channel for Sellers are the
  main defense.
- **Catalog curation load:** fuzzy-match-before-create plus a merge tool reduces
  this, but someone still owns ongoing catalog quality as an operational task, not
  a one-time build.
- **Scope discipline:** commission/escrow is deferred to v2 for good reason — resist
  pulling it forward into v1.
