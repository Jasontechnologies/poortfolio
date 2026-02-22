# JasonWorldOfTech (Next.js + Supabase)

This repository now includes a Next.js full-stack foundation for:
- Personal brand site
- Parent company site
- Product launcher hub
- Google sign-in + support chat + complaints via Supabase

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment values:
   ```bash
   cp .env.example .env.local
   ```
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Run development server:
   ```bash
   npm run dev
   ```

## Supabase
- SQL schema + RLS policies are in `supabase/migrations/0001_init.sql`.
- Enable Google Auth in Supabase dashboard and set callback to your app URL.

## Brand Theme
The UI uses your requested colors:
- Black `#111111`
- White `#ffffff`
- Lemon green `#b8e35a`
