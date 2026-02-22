# Security Secrets Policy

This repository must never store live secrets in Git.

## Never Commit

- `.env*` files containing real values
- Private keys or certificates (`*.pem`, `*.key`, `*.crt`, `*.cert`, `*.p12`, `*.pfx`)
- Service role credentials (Supabase service role keys, service-account JSON files)
- Turnstile, OpenAI, Stripe, or other provider secret keys
- Local deployment overrides (`.envrc`, local Vercel files, machine-specific config)

## Safe Files

- `.env.example` with placeholder values only
- Documentation that lists variable names only (no values)

## Required Local Practice

- Keep real secrets in local environment variables or Vercel project settings.
- Run `npm run check:secrets` before commit/push.
- Use `npm run prepush` before pushing release branches.

## If a Secret Is Exposed

1. Revoke/rotate the secret immediately in the provider dashboard.
2. Remove it from files and commit history as needed.
3. Update affected environments (local, preview, production).
4. Verify access logs and incident impact.
