# Vercel Deployment Guide

This project is a Next.js App Router app using Supabase.

## Required Environment Variables

Names only. Do not store secret values in Git.

### Public (client-safe)

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for compatibility)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (if challenge is enabled)

### Server-only (never client-exposed)

- `TURNSTILE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if/when server-side admin tasks require it)
- `OPENAI_API_KEY` (if/when enabled)
- `STRIPE_SECRET_KEY` (if/when enabled)

## Configure in Vercel

1. Open Vercel project settings.
2. Go to **Environment Variables**.
3. Add variables for both:
   - **Production**
   - **Preview**
4. Redeploy after adding/updating values.

## Domain Setup

1. In Vercel project, open **Domains**.
2. Add primary domain and `www` as needed.
3. Update DNS records per Vercel instructions.
4. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain.

## Security Headers / CSP

- Security headers are configured in `next.config.js`.
- CSP is intentionally applied to public routes and excludes `/admin` and `/api/admin` to reduce breakage risk in admin tooling.

## Post-Deploy Smoke Test URLs

- `/`
- `/products`
- `/blog`
- `/updates`
- `/status`
- `/security`
- `/sign-in`
- `/support/chat` (authenticated)
- `/admin` (admin/super_admin/support_agent)
- `/robots.txt`
- `/sitemap.xml`
- `/rss.xml`
