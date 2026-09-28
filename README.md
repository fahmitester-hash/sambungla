# Sambungla — Edge-native AI Personal Branding for Malaysia

Full-stack Cloudflare build: Next.js (Pages, Edge Runtime) + D1 + a standalone
cron Worker that auto-publishes scheduled posts directly to LinkedIn.

## Setup

```bash
npm install
npx wrangler login

# Create infra
npx wrangler d1 create sambungla-db          # copy database_id into wrangler.toml AND wrangler-cron.toml
npx wrangler kv:namespace create "KV_CACHE"  # copy id into wrangler.toml

# Initialize schema
npm run db:init

# Secrets — main Pages app
npx wrangler pages secret put OPENAI_API_KEY
npx wrangler pages secret put AUTH_SECRET       # generate with: npx auth secret
npx wrangler pages secret put LINKEDIN_CLIENT_ID
npx wrangler pages secret put LINKEDIN_CLIENT_SECRET

# Secrets — cron worker (separate deployable, see wrangler-cron.toml)
npx wrangler secret put OPENAI_API_KEY --config wrangler-cron.toml   # style memory regeneration

# Local dev
cp .env.local.example .env.local   # fill in real values
npm run dev

# Deploy
npm run deploy                                      # main app
npx wrangler deploy --config wrangler-cron.toml      # cron worker (separate deploy)
```

## LinkedIn Developer App

Create at developer.linkedin.com. Add products:
- "Sign In with LinkedIn using OpenID Connect" (self-serve, instant)
- "Share on LinkedIn" (self-serve, instant — grants `w_member_social`)

Redirect URL: `https://your-domain/api/auth/callback/linkedin`

No partner approval needed for posting to a user's own profile. Company-page
posting (`w_organization_social`) is a separate, slower Marketing Developer
Platform application — not implemented here.

## Writing style memory + inspiration library

- **Writing style memory** (`/api/style/samples`, `writing_samples` table): learns
  from posts pasted in manually and from every post auto-published through
  Sambungla. Distills into a compact style guide (not raw quotes) injected into
  every future generation once 3+ samples exist.
- **Templates and hooks** (`src/lib/templates.ts`, `/dashboard/inspiration`):
  12 original starting-point structures. "Use this" feeds the seed into the
  generator rather than pasting finished text — so tone/style localization
  still applies on top of it.
- **Swipe file** (`/api/swipe`, `swipe_file` table): user-curated inspiration,
  intentionally kept separate from `writing_samples` so other people's post
  structures never blend into a user's own learned voice.

Fresh installs get all of this from `schema.sql` directly. If you already
initialized D1 before this update, run:

```bash
npm run db:init  # or apply migration_003 and migration_004 individually
```

## What's flagged as needing your decision before production

1. **`LinkedIn-Version` header** in `worker-cron.ts` — LinkedIn updates this
   release-dated string periodically. Confirm the current value in your
   Developer Portal before first deploy.
2. **Testimonials and pricing on the marketing page** (`src/app/page.tsx`) —
   placeholders only. Do not launch with fabricated customer quotes.
3. **60-day LinkedIn token expiry** — standard (non-MDP) apps don't get
   refresh tokens. The reconnect banner in the dashboard handles this, but
   it's a real recurring UX touchpoint (every ~60 days), not a one-time
   setup step. Users will need to click through LinkedIn login again
   periodically to keep auto-publishing working.

## Architecture

Dashboard (generate + schedule) → D1 `posts` + `scheduling_queue` → cron
Worker (every 60s) → LinkedIn `/rest/posts` (auto-publish) → writing style
sample captured on success. Fallback copy-paste page at `/publish/[postId]`
only fires if LinkedIn auth is missing or expired.

## Note on what was removed

WhatsApp was part of earlier design iterations of this project — both as a
publish-notification channel (cron worker texting the user) and as a
lead-gen CTA link appended to generated posts. Both were fully removed by
deliberate choice to simplify launch. If you want either back later:
notifications would hook into `worker-cron.ts` after the LinkedIn publish
call succeeds/fails; the CTA link would hook into `/api/generate/route.ts`
before the stream closes. Neither is required for the app to function.
