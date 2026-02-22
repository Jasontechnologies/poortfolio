# Release Checklist

Use this checklist before every production push/deploy.

## 1) Code Health

1. `npm install`
2. `npm run lint`
3. `npm run build`
4. `npm run check:secrets`
5. `npm run prepush` (combined local gate)

Note: Husky is not required. Run `npm run prepush` manually before `git push`.

## 2) Git Readiness

1. `git status` is expected and reviewed.
2. No secrets are staged.
3. Commit message is clear and scoped.

## 3) Environment Validation (Vercel)

1. Confirm required env var names exist in Vercel:
   - Production
   - Preview
2. Confirm public vars are only `NEXT_PUBLIC_*`.
3. Confirm server-only vars are not exposed to client builds.

## 4) Database / Supabase

1. Apply pending SQL migrations in order.
2. Confirm RLS and role/policy changes are active.
3. Confirm auth/profile bootstrap migrations are applied.

## 5) Deploy

1. Push branch to Git remote.
2. Verify Vercel build/deploy completes with no runtime env errors.

## 6) Smoke Test (Post Deploy)

1. `/`
2. `/products`
3. `/blog`
4. `/updates`
5. `/status`
6. `/sign-in`
7. `/support/chat` (authenticated)
8. `/admin` (admin role)
9. `/robots.txt`
10. `/sitemap.xml`
11. `/rss.xml`
