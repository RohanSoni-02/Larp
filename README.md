# larpr

A Strava for skills. People log, prove and show off progress in hobbies like piano, candle
making, pottery or lifting — and connect with others learning the same thing.

Everyone starts out larping. This is where you stop pretending.

**Status: Phase 1 (foundations) complete.** Auth, onboarding, the five-tab shell, the full
database schema with row-level security, and the seeded mock community. Sessions, trees,
feed and everything else arrive in later phases — see the roadmap below.

## Stack

- **Expo (SDK 58) + React Native + TypeScript (strict) + Expo Router**
- **Supabase** — Postgres, Auth, Storage, Edge Functions, Realtime
- **TanStack Query** (server state) + **Zustand** (local UI state only)
- **react-native-svg + Reanimated** (skill tree, celebrations — later phases)
- **Firebase Crashlytics** (crashes — free at any volume) + **PostHog** (analytics, 1M events/mo free)
- **EAS Build / EAS Update**

## Prerequisites

- Node 22+ and npm
- Docker Desktop (for local Supabase)
- Xcode (iOS) or Android Studio (Android) for dev builds
- macOS users: `brew install --cask docker` is enough for the database workflow

## Setup (five minutes)

```bash
cd larping
npm install

# 1. Start the local backend (Postgres, Auth, Storage, Studio). First run downloads images.
npx supabase start

# 2. Apply migrations + seed the mock community
npm run db:reset

# 3. Configure the app. Copy the "API URL" and "anon key" printed by `supabase start`.
cp .env.example .env

# 4. Run the app
npm start
```

Press `i` for the iOS simulator, `a` for Android, or scan the QR code with Expo Go.
(Expo Go works for Phase 1 screens; camera, push and Crashlytics need a dev build — see below.)

### Seed users

The seed recreates the prototype's mock community (Maya, Kenji, Lena and 25 others).
Sign in with any of them, e.g.:

```
maya.lifts@larping.dev / password123
kenji.plays@larping.dev / password123
```

Or use the email code flow — local Supabase captures mail in **Inbucket** at
<http://127.0.0.1:54324> (the 6-digit code is in the email). Supabase Studio runs at
<http://127.0.0.1:54323>.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm test` | Unit tests (XP, levels, tiers, streaks, RPG class) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run db:reset` | Re-apply migrations + reseed |
| `npm run test:rls` | RLS integration tests (needs local Supabase running) |
| `npm run db:types` | Regenerate `src/types/database.types.ts` from the schema |

## Database workflow

- **All schema changes are SQL migrations** in `supabase/migrations/`. Never edit the DB by hand.
- New migration: `npx supabase migration new my_change` → write SQL → `npm run db:reset`.
- **Every table enables RLS in the same migration that creates it.**
- **Progression is server-computed.** Clients can't write `sessions`, `xp_events`,
  `node_progress`, `user_skills` totals, `user_streaks`, `vouches` or `tier_history` — the
  grants are revoked from API roles. Writes flow through security-definer functions
  (`save_session` in Phase 2, `cast_vouch` in Phase 7).
- **Seed data is code** (`supabase/seed.sql`), rebuilt from scratch by `db:reset`.

## Launching a brand-new community (cold start)

A new app has no posts, so migration `0015_official_guides` seeds nine clearly labelled
**official larpr guide** accounts (one per launch skill) with two posts each: a starter session
and a tip, each with a photo. They are not fake people: they carry an "Official" badge, say so
in their bio, have no kudos, followers, tier, XP or streaks, cannot sign in or be messaged, and
stay off the leaderboards.

- **Fade-out:** the For You feed blends guide posts with real ones and drops them once there
  are about 12 real posts (`src/features/posts/blend.ts`). Following feeds are never padded.
- **Deploys:** Vercel production builds run `scripts/vercel-build.sh`, which applies pending
  migrations (`supabase db push`) and uploads `supabase/seed-media/official/` to the public
  `official` bucket before exporting the app, so the client never ships ahead of the schema. A
  failed migration fails the build and leaves the current deployment live. Preview builds share
  the production database and only dry-run. Locally, `db reset` does both. Migration `0014`
  creates the launch skill catalog, because production never had approved skills.
- **Images:** skill photos are bundled in `assets/covers/` (up to three per skill). They are the
  skill sphere's covers and stand in for any post without a photo of its own, across the feed,
  stories, Explore and profiles. All of these images are AI-generated. To replace them with
  licensed photography, overwrite the files with the same names and redeploy.
- **Production data:** production holds only the guides and real accounts. `supabase/seed.sql`
  (the 28 demo users, rooms, guilds and events) is for local development only and must never
  be run against production. Arena shows empty states for rooms and guilds until real ones exist.
- **Retiring guides:** `delete from auth.users where email like 'guide-%@guides.larpr.invalid'`
  removes the accounts and their posts.

## Auth providers

- **Email code** works out of the box (locally via Inbucket).
- **Magic links in production** need a real SMTP provider — Supabase's built-in one is
  dev-rate-limited. Free option: [Resend](https://resend.com) (100 emails/day), configured in
  Supabase Dashboard → Auth → SMTP.
- **Apple**: works on iOS dev builds; enable "Sign In with Apple" in the Supabase dashboard
  and the Apple Developer portal.
- **Google**: set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and add the native client IDs in the
  Supabase dashboard.

## Crashlytics (Firebase)

1. Create a free Firebase project, add iOS + Android apps (`com.larping.app`).
2. Download `GoogleService-Info.plist` and `google-services.json` into this folder
   (both are gitignored — never commit them).
3. Build a dev client: `npx expo run:ios` or `eas build --profile development`.

## Project structure

```
app/                  Expo Router routes (thin — no logic)
  (auth)/             welcome, sign-in, onboarding
  (tabs)/             Home, Explore, Start (modal), Trees, Profile
  session/            full-screen session modal (Phase 2)
src/
  features/           one folder per feature: api.ts + hooks.ts + components
  components/         shared UI (Button, Card, Avatar, TierPill, …)
  gamification/       pure rules (XP, levels, tiers, streaks) — unit-tested
  lib/                supabase client, query client, analytics, crash reporting
  stores/             Zustand (local UI state only)
  theme/              colors + typography from the prototype
  types/              app types; database.types.ts is generated
supabase/
  migrations/         all schema changes, RLS included
  seed.sql            the mock community from the prototype
tests/
  rls/                SQL integration tests for the security policies
```

## Environment variables

See `.env.example`. Only `EXPO_PUBLIC_*` vars reach the app. Server secrets (service-role
key, Resend, moderation provider) live in Edge Function secrets only.

## Roadmap

1. ✅ Foundations: setup, CI, schema + RLS, auth, onboarding, seed, tab shell
2. Core loop: session timer, media upload, `save_session`, XP/streaks/tiers, celebration
3. Skill trees (game-style), node sheets, custom skills
4. Social: feed, kudos, comments, follows, Activity, report/block, moderation, push
5. Larp Check + stories
6. Explore: quests, standards, co-op rooms, guilds
7. Vouching + full Larp to Legit
8. Glow-up reel worker + sharing
9. Polish: accessibility, performance, offline, store assets, beta builds
