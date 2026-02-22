# JasonWorldOfTech Website Plan (with Supabase)

## Can we use Supabase for the backend?
Yes. Supabase is a strong fit for your website goals:
- Personal brand site
- Parent company site
- Product launcher hub
- Google sign-in and user messaging/complaints

Supabase gives you authentication, PostgreSQL database, row-level security (RLS), storage, and realtime updates in one backend.

## Recommended architecture
- **Frontend:** Next.js + Tailwind CSS
- **Backend:** Supabase (Auth, Postgres, Storage, Realtime)
- **Hosting:** Vercel (frontend) + Supabase cloud project

## User flows to support
1. Visitor browses your profile, company vision, team, and products.
2. Visitor clicks **Sign in with Google**.
3. Signed-in user can:
   - Start a chat with you
   - Submit a product complaint
4. You receive admin alerts and manage chats/complaints from an admin dashboard.

## Core data model (Supabase tables)
1. `profiles`
   - `id uuid` (same as `auth.users.id`)
   - `full_name text`
   - `avatar_url text`
   - `role text` (`user`, `admin`, `support`)
   - `created_at timestamptz`

2. `products`
   - `id uuid`
   - `name text`
   - `slug text`
   - `short_description text`
   - `status text` (`active`, `beta`, `archived`)
   - `created_at timestamptz`

3. `chat_threads`
   - `id uuid`
   - `user_id uuid`
   - `status text` (`open`, `closed`)
   - `created_at timestamptz`

4. `chat_messages`
   - `id uuid`
   - `thread_id uuid`
   - `sender_id uuid`
   - `message text`
   - `created_at timestamptz`

5. `complaints`
   - `id uuid`
   - `user_id uuid`
   - `product_id uuid`
   - `title text`
   - `details text`
   - `priority text` (`low`, `medium`, `high`)
   - `status text` (`new`, `in_review`, `resolved`)
   - `created_at timestamptz`

## Security model (important)
Use **Row Level Security** on all user data tables.

- Users can read/update only their own profile.
- Users can create/read only their own chat threads and messages.
- Users can create/read only their own complaints.
- Admin/support roles can read and respond to all chats/complaints.

## Auth setup
- Enable Google provider in Supabase Auth.
- Add OAuth callback URLs for local and production.
- Auto-create `profiles` record on first login (via trigger or app logic).

## Website page plan
- `/` Home (brand + key CTAs)
- `/about` Personal + parent company story
- `/products` Product launcher hub
- `/products/[slug]` Product detail page
- `/support/chat` Authenticated live chat page
- `/support/complaints/new` Complaint submission form
- `/dashboard` Admin dashboard for chats/complaints

## MVP build phases
### Phase 1 (Week 1)
- Brand structure and pages: Home, About, Products
- Supabase project setup + Google Auth

### Phase 2 (Week 2)
- Complaint system (form + complaint list for user)
- Admin complaint management view

### Phase 3 (Week 3)
- Realtime chat (threads + messages)
- Admin support inbox

### Phase 4 (Week 4)
- Hardening: RLS audit, validation, abuse protection, analytics
- Launch and feedback loop

## Immediate next steps
1. Create Supabase project and enable Google OAuth.
2. Build Next.js app shell with protected routes.
3. Implement the five core tables + RLS.
4. Launch complaints feature first, then realtime chat.

This sequence keeps delivery fast while building toward a full support system.
