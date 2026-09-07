# Infra — Supabase + Vercel

Current state: pakfrag.com runs on Supabase's free tier and Vercel's free (Hobby)
tier. Figures below were checked in September 2026 — providers change these
fairly often, so confirm current numbers at supabase.com/pricing and
vercel.com/pricing before committing budget.

## The most urgent issue isn't scale — it's Vercel's Hobby plan terms

Vercel's Hobby plan is restricted to personal, non-commercial use. Their own fair
use guidelines define commercial use broadly — it covers any project that
processes payment or generates revenue for anyone involved in building it, not
just large-scale traffic. Since pakfrag.com already runs a paid seller
subscription model, it likely already falls outside Hobby's permitted use today,
independent of how much traffic the site gets.

**Recommendation: move to Vercel Pro (~$20/seat/month) now, not at some future
traffic milestone.** This is a compliance decision, not a scaling one — staying on
Hobby risks account suspension regardless of whether the marketplace rebuild ships
tomorrow or in six months.

**This isn't hypothetical for this project, either.** The repo's own CLAUDE.md
documents a 2026-08 incident where an unbounded Supabase query pattern quietly
burned through Hobby's 4-CPU-hour monthly allowance over several weeks — on a
recommendations feature, which is lighter than full-text marketplace search will
be. The compliance risk and the technical risk point at the same fix.

## Supabase free tier — what it actually gives you

As of mid-2026, the free tier is roughly:

- 500 MB database storage
- 1 GB file storage
- Around 5 GB egress bandwidth/month (some sources report a lower figure —
  reconfirm before architecting around it)
- 50,000 monthly active users
- No backups, no SLA
- Projects auto-pause after 7 days with no database activity (manual restore
  required)
- Max 2 active free projects
- Shared compute — response times degrade under concurrent load

## Why each of these matters for this specific project

- **No backups is the real risk, not the 500 MB cap.** Once this database holds
  real seller subscriptions, manually-issued credentials, and eventually
  payment-adjacent data (Phase 4), a bad migration or accidental delete has no
  rollback path on the free tier. That's a business-continuity risk, not a
  technical inconvenience — treat it as a launch blocker, not a someday upgrade.
- **500 MB of database storage is likely fine at launch scale** (hundreds of
  sellers, a few thousand listings) — this usually isn't the first thing you hit.
- **1 GB of file storage will fill up fast once sellers upload product photos.**
  Budget for this being the first cap the project actually bumps into, and plan
  image storage/CDN delivery accordingly.
- **Shared compute means search — the entire value proposition over Facebook —
  can slow down exactly when traffic peaks**, e.g. right after a launch
  announcement.
- **The 2-project cap makes a proper staging/production split tight on free
  tier.** Wanting a real staging environment before pushing changes to a live
  marketplace is itself a reason to move to Pro, separate from any traffic
  argument.

## Recommended migration triggers

- **Vercel Pro:** now — see compliance note above.
- **Supabase Pro (~$25/month):** at or before Phase 2 (soft launch), not after.
  You want backups and dedicated resources in place before real seller and buyer
  data exists, not as a reaction to a data-loss incident.

## Security checklist for this rebuild

- Passwords hashed with bcrypt or argon2 — never stored plaintext.
- Row Level Security (RLS) policies on every Supabase table — Sellers can only
  modify their own listings, Members only their own Partial listings.
- Login rate limiting / lockout after repeated failed attempts — manually-issued
  usernames are guessable, and there's no email-based recovery flow to fall back
  on as a secondary defense.
- Separate staging and production Supabase projects once on Pro.
- All secrets (DB credentials, future PSP API keys) stored as Vercel environment
  variables — never committed to the repo.
- A basic Terms of Service and privacy policy in place before Phase 3 (public
  launch) — see PROJECT_PLAN.md for what it needs to cover.
