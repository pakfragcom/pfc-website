# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build (also runs next-sitemap postbuild)
npm start        # serve production build
```

There are no lint or test scripts — the project has no ESLint config and no test suite.

## Stack

- **Next.js 13** (Pages Router — not App Router) with React 18
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

`lib/admin-guard.js` exports `resolveIdentity(req, res)` (returns identity object or null) and `getServerSideProps` (wraps it with redirect). All four pfc-mgmt pages re-export `getServerSideProps` from admin-guard and receive `{ identity }` as a prop.

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

**ISR pages** (`verify-seller`, `local-houses`, `houses/[slug]`, `u/[username]`): use `getStaticProps` + `revalidate: 300` with the anon `supabase` client. These pages are publicly cached at the CDN.

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
  index.js              — homepage
  local-houses.js       — local fragrance brands directory (ISR)
  tools/
    verify-seller.js    — seller verification search (ISR)
    decant.js           — decant price calculator
    indie-lab.js        — multi-tab indie/niche tool (large file)
    bottle-level.js     — bottle fill estimator
  houses/[slug].js      — individual house profile (ISR)
  reviews/
    index.js            — reviews listing (ISR)
    [slug].js           — individual review (ISR)
    submit.js           — review submission form (auth-gated client-side)
  u/
    me.js               — private profile page (SSR, auth-gated)
    [username].js       — public profile page (ISR)
  auth/
    login.js, signup.js, callback.js
  pfc-mgmt/             — admin panel (all SSR, identity-gated)
  api/admin/            — admin API routes
  api/profile/          — user profile API routes
```

## Styling Conventions

- Dark theme throughout: `bg-black` / `bg-[#0a0a0a]` base, `text-white`
- Brand green: `#2a5c4f` (dark), `#557d72` (mid), `#94aea7` (light/muted)
- Glass cards: `bg-white/5 ring-1 ring-white/10 rounded-2xl`
- Form inputs: `bg-black/40 ring-1 ring-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-white/25`
- All pages include `<Header />` and `<Footer />` from `components/layout/` except the admin panel which uses `<AdminNav />`

## CSP Note

`next.config.js` has a strict CSP. If you add new external script/connect sources (e.g. a new analytics provider or API), add them to the relevant directive in the `headers()` config or requests will be blocked.
