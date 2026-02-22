# JasonWorldOfTech (Next.js + Supabase)

This repository includes a founder-led brand platform with:
- Account creation + sign-in (email/password)
- Verified-user support chat + complaints
- Products hub + blog foundation
- Admin-ready content tables (products/posts) and audit logging

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment values:
   ```powershell
   Copy-Item .env.example .env.local
   ```
   ```bash
   cp .env.example .env.local
   ```
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
4. Run SQL migrations in Supabase SQL editor, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_platform_hardening.sql`
5. In Supabase dashboard, enable Email provider under Auth.
6. Run development server:
   ```bash
   npm run dev
   ```

## Security Foundation
The app now enforces day-1 abuse protection with layered limits:
- Gateway middleware limit layer (`middleware.ts`)
- Route-level in-app limits (`lib/security/rate-limit.ts`)
- Traefik starter middleware config (`infra/traefik/dynamic/rate-limit.yml`)

Implemented protected endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /chat/message`
- `POST /support/complaints`
- `POST /api/contact`

Implemented hardening:
- Signup honeypot field
- Disposable email blocking on registration
- Lightweight device fingerprint hashing
- Verified-email requirement for chat access
- Chat message cooldown + first-message link blocking
- Max open chat thread guard

## Content and Admin Foundation
- New tables: `posts`, `product_post_links`, `contact_messages`, `audit_log`
- `products` extended with `landing_url`, `logo_url`, `sort_order`, `updated_at`, `draft/live`
- Role model updated to: `user`, `super_admin`, `editor`, `support`
- Admin API foundations:
  - `GET/POST/PATCH /admin/products`
  - `GET/POST/PATCH /admin/posts`

## Public Pages
- `/about`
- `/founder`
- `/products`
- `/blog`
- `/cookies`
- `/contact`
- `/privacy`
- `/terms`
- `/acceptable-use`
- `/security`

## Loading UX
- Global top route progress bar via `nextjs-toploader` in `components/navigation/top-progress-bar.tsx`
- App Router segment loaders with skeleton UI:
  - `app/loading.tsx`
  - `app/products/loading.tsx`
  - `app/blog/loading.tsx`
  - `app/blog/[slug]/loading.tsx`
  - `app/support/chat/loading.tsx`

## Cookie Consent
- Consent provider + modal + first-visit banner:
  - `components/consent/consent-provider.tsx`
- Footer `Cookie settings` control:
  - `components/consent/cookie-settings-button.tsx`
- Consent storage:
  - Cookie `jwot_consent` (versioned JSON with timestamp)
- Optional script gating:
  - Google Analytics (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
  - Plausible (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`)
  - Analytics scripts load only when analytics consent is `true`
