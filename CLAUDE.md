# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build (also runs next-sitemap postbuild)
npm start        # serve production build
npm test         # vitest run — lib/**/*.test.js, enforced in CI on every push/PR
```

There is no ESLint config. There is a small Vitest suite under `lib/**/*.test.js` — extend it when adding logic to `lib/`, and see the Fluid CPU guardrail below before adding a new API route.

### Fluid Active CPU guardrail

In 2026-08, an API route (`/api/recommendations`) ran two unbounded full-table Supabase fetches plus O(n×m) scoring on every homepage view for every logged-in visitor, uncached — it quietly burned through the Vercel Hobby plan's 4 CPU-hour monthly allowance over several weeks. Fixed by caching the shared (non-per-user) part of the computation in-memory with a TTL (`lib/recommendation-cache.js`), the same pattern `lib/rate-limit.js` already used.

Two conventions came out of that incident, both enforced by `lib/query-safety.test.js` in CI:

1. **Every Supabase read in `pages/api/**` must be bounded** — `.limit()`, `.single()`, `.maybeSingle()`, `.range()`, `count:'exact',head:true`, or scoped to one owner's rows via `.eq('*_id', ...)`. A page that fetches an entire table and filters by status client-side (the exact shape of the original `reviews.js`/`orders.js` bug, later also found in `fragrances.js`) is the pattern to avoid — fetch one status server-side, get counts for the others via a parallel `head:true` count query instead. A handful of small, genuinely admin-only tables are allowlisted in that test file with a one-line reason; add to the allowlist only after checking the table's real size and traffic shape, not as a way to silence a failing test.
2. **Anything computed identically for every visitor must not be recomputed per-request** — especially on high-traffic pages. If it can't be ISR-cached (e.g. because it's gated by session auth), cache it in-memory with a TTL instead, matching `lib/recommendation-cache.js`.

## Stack

- **Next.js 16** (Pages Router — not App Router) with React 19. Request-time routing lives in `proxy.js` (the Next 16 name for middleware) and client-side Sentry init in `instrumentation-client.js`
- **Builds MUST use Webpack** (`next build --webpack`, already set in `package.json`). Never switch to Turbopack: it injects an inline bootstrap `<script>` that this site's CSP (no `'unsafe-inline'`, no nonces) blocks, which silently kills all client-side JavaScript in production — verify-seller search, both logins and every button went dead for ~20 minutes on 2026-11-15 this way. See "Deploy verification" below.
- **Tailwind CSS** for all styling; no CSS modules or styled-components
- **Supabase** as database, auth, and storage
- **Framer Motion** for animations
- **Vercel** for deployment (ISR + CDN caching configured in `next.config.js`)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       # public, safe in browser
NEXT_PUBLIC_SUPABASE_ANON_KEY  # public, safe in browser
SUPABASE_SERVICE_ROLE_KEY      # server-only — bypasses RLS, never expose to client
```

## Supabase Client Patterns

There are three different Supabase clients — use the right one for the context:

| Client | File | Use |
|---|---|---|
| `supabase` | `lib/supabase.js` | `getStaticProps` / ISR — no session needed |
| `supabaseAdmin` | `lib/supabase-admin.js` | Server-only API routes + `getServerSideProps` — bypasses RLS |
| `createServerClient` | `@supabase/ssr` | `getServerSideProps` when you need the **user's session** (reads PKCE verifier from `req.cookies`) |
| `createBrowserClient` | `@supabase/ssr` via `lib/auth-context.jsx` | Client-side — stores PKCE verifier in cookies, not localStorage |

**Never import `supabaseAdmin` in client-side code.** The service role key is not in `NEXT_PUBLIC_*`, so it won't accidentally leak, but the pattern is wrong regardless.

When building a `createServerClient` in `getServerSideProps` or an API route, copy the `getAll` / `setAll` cookie pattern from `pages/auth/callback.js` — it manually reads from `req.cookies` and writes `Set-Cookie` headers because Next.js Pages Router doesn't provide cookie helpers.

## Auth Architecture

**Public users:** `AuthProvider` in `pages/_app.js` wraps the whole app. Use `useUser()` and `useSupabaseClient()` from `lib/auth-context.jsx`. The Google OAuth flow uses PKCE; the code exchange happens server-side in `pages/auth/callback.js` via `getServerSideProps`.

**Admin panel (`/pfc-mgmt`):** Two-tier identity system:
- **Admin** — password cookie `pfc_admin_session` (HMAC token). `isAdminAuthenticated(req)` from `lib/admin-auth.js` checks it. Session lasts 8 hours. Having the cookie takes priority over everything else.
- **Moderator** — Supabase account with `profiles.role = 'moderator'` + per-section toggles in `moderator_permissions` table.

`lib/admin-guard.js` exports `resolveIdentity(req, res)` (returns identity object or null) and `getServerSideProps` (wraps it with redirect). All pfc-mgmt pages re-export `getServerSideProps` from admin-guard and receive `{ identity }` as a prop.

`lib/api-auth.js` exports `resolveApiAuth(req, res)` for API routes — sends 401 and returns `{ ok: false }` if unauthorized, otherwise `{ ok: true, type, permissions }`.

The identity object shape used everywhere:
```js
{
  type: 'admin' | 'moderator',
  displayName: string,
  permissions: {
    is_admin: boolean,
    can_manage_sellers: boolean,
    can_manage_houses: boolean,
    can_manage_reviews: boolean,
  }
}
```

## Key Data Flows

**ISR pages** (`mbp`, `houses/[slug]`, `sellers/[slug]`, `u/[username]`, `iso/explore`, `marketplace/*`, `pakistan-fragrance-index`, …): use `getStaticProps` + `revalidate` (600–3600s; `lib/isr-revalidate-safety.test.js` fails CI below 600s) with the anon `supabase` client. These pages are publicly cached at the CDN.

**`/tools/verify-seller` is NOT ISR** — it is a static page whose search box calls `/api/sellers/search` on each debounced keystroke and `/api/sellers/blacklist` on toggle. Both routes serve from in-memory TTL caches (`lib/sellers-cache.js`, `lib/blacklist-cache.js`); admin writes in `pages/api/admin/sellers.js` invalidate the seller cache. It is the site's highest-traffic page and must not be broken by unrelated work — baseline it before and after every deploy (search `?q=an` → 15 results; blacklist → current count; page 200).

**SSR pages** (`u/me`, all `/pfc-mgmt/*`): use `getServerSideProps`. `u/me` requires a live session check via `createServerClient`.

**API routes** (`pages/api/admin/*`): all guarded by `resolveApiAuth`. Permission gates follow the auth check:
- `stats.js` — any valid auth, no permission gate
- `sellers.js`, `mark-paid.js` — require `can_manage_sellers`
- `houses.js` — requires `can_manage_houses`
- `reviews.js` — requires `can_manage_reviews`
- `team.js` — requires `is_admin`

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles; `role` column: `member`, `reviewer`, `moderator`, `admin` |
| `sellers` | Verified sellers; `status`: `active`, `grace`, `expired`, `pending`; `user_id` links to auth user |
| `fragrance_houses` | Local fragrance houses with profile data |
| `reviews` | Community fragrance reviews; `status`: `pending`, `approved`, `rejected` |
| `subscriptions` | Payment ledger for seller subscriptions |
| `moderator_permissions` | Per-moderator section toggles (`user_id` PK) |

RLS is enabled on all tables. Public reads are restricted to active/grace status. `supabaseAdmin` bypasses RLS for server-side operations.

## Page Structure

```
pages/
  index.js              — homepage (fully static; no data fetching)
  mbp.js                — Pakistani fragrance houses directory (ISR)
  houses/[slug].js      — individual house profile (ISR)
  tools/
    verify-seller.js    — seller verification search (static page + cached API; see Key Data Flows)
    decant.js, bottle-level.js, indie-lab.js — calculators (client-side)
  sellers/
    [slug].js           — public seller profile (ISR)
    apply.js            — seller application form
    dashboard.js        — seller's own inventory/listings (SSR, auth-gated)
  iso/                  — "In Search Of" demand board: index, post, explore (ISR)
  marketplace/          — listings browse (ISR); hidden from nav
  log-transaction.js, order.js, sell.js, disputes/new.js — user flows (auth-gated client-side)
  pakistan-fragrance-index.js — price index from logged transactions (ISR)
  fragrances/, reviews/, onboarding/scent-quiz.js — built but HIDDEN from nav/sitemap until they have content
  u/
    me.js               — private profile page (SSR, auth-gated)
    [username].js       — public profile page (ISR)
  auth/                 — login.js, signup.js, callback.js (Google OAuth, PKCE)
  pfc-mgmt/             — admin panel, 11 pages (all SSR, identity-gated); to be rebuilt as a back-office in the shop plan
  api/admin/            — admin API routes
  api/sellers/          — public seller search/blacklist (cached) + seller self-service
  api/profile/, api/transactions/, api/reviews/, api/iso/, api/listings/, api/orders/ … — user-facing API routes (all writes are server-side)
```

Roadmap and infra context live in `PROJECT_PLAN.md` (status note at the top is current) and `INFRA.md`.

## Styling Conventions

- Dark theme throughout: `bg-black` / `bg-[#0a0a0a]` base, `text-white`
- Brand green: `#2a5c4f` (dark), `#557d72` (mid), `#94aea7` (light/muted)
- Glass cards: `bg-white/5 ring-1 ring-white/10 rounded-2xl`
- Form inputs: `bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-white/25`
- All pages include `<Header />` and `<Footer />` from `components/layout/` except the admin panel which uses `<AdminNav />`

## CSP Note

`next.config.js` has a strict CSP. If you add new external script/connect sources (e.g. a new analytics provider or API), add them to the relevant directive in the `headers()` config or requests will be blocked. The CSP has no `'unsafe-inline'` and no nonces, so **nothing may rely on inline `<script>` tags** — that is why builds are pinned to Webpack (see Stack).

## Branches and deploys

- `main` is production (Vercel auto-deploys on push). Feature work happens on `shop`; land it on `main` with a fast-forward merge once build + tests + the deploy verification below pass. `marketplace-v2` is retired — do not branch from it.
- Commit per working step with a "how to test" note in the message.

## Deploy verification (required after every deploy)

A `200` from curl is not proof the site works — on 2026-11-15 every page returned 200 while no client JavaScript ran at all. After each deploy, for `/`, `/tools/verify-seller`, `/pfc-mgmt/login` and `/auth/login`:

1. **CSP-blockable inline scripts must be 0**: count `<script>` tags with no `src` whose type is not `application/json` / `application/ld+json`.
2. **Every `/_next/…` script the HTML references must return 200.**
3. **verify-seller API baseline**: `/api/sellers/search?q=an&type=ALL` returns 15 results (first "Abdullah Nazir AN-K9C7"); `/api/sellers/blacklist` returns the current count; proxy returns 403 for scraper user-agents.
4. **Ask the owner to click-test in a real browser** (search on /verify, open the blacklist, log into /pfc-mgmt). There is no browser tool in this environment.

`public/sitemap-0.xml` is regenerated by every local `npm run build` with zero dynamic URLs (placeholder Supabase creds in `.env.local`) — restore it with `git checkout -- public/sitemap-0.xml` before committing. Vercel regenerates it correctly.
