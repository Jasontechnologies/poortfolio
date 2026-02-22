create extension if not exists pgcrypto;

-- Role and profile hardening.
update public.profiles
set role = 'support_agent'
where role = 'support';

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check check (role in ('user', 'support_agent', 'admin', 'super_admin'));

alter table public.profiles
add column if not exists is_banned boolean not null default false,
add column if not exists client_id text;

-- Audit log v2 fields (keep backwards compatibility with existing columns).
alter table public.audit_log
add column if not exists action_type text,
add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
add column if not exists target_type text,
add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.audit_log
set
  action_type = coalesce(action_type, action),
  actor_user_id = coalesce(actor_user_id, actor_id),
  target_type = coalesce(target_type, target_table),
  metadata = coalesce(metadata, details, '{}'::jsonb);

create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);
create index if not exists idx_audit_log_action_type on public.audit_log (action_type);
create index if not exists idx_audit_log_actor_user on public.audit_log (actor_user_id);

drop policy if exists "Admin can insert audit log" on public.audit_log;
drop policy if exists "Support/Admin can insert audit log" on public.audit_log;
create policy "Support/Admin can insert audit log" on public.audit_log
for insert
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));

drop policy if exists "Super admin can read audit log" on public.audit_log;
drop policy if exists "Support/Admin can read audit log" on public.audit_log;
create policy "Support/Admin can read audit log" on public.audit_log
for select
using (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- Feature flags.
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists feature_flags_set_updated_at on public.feature_flags;
create trigger feature_flags_set_updated_at
before update on public.feature_flags
for each row
execute function public.set_updated_at();

alter table public.feature_flags enable row level security;

drop policy if exists "Public can read feature flags" on public.feature_flags;
create policy "Public can read feature flags" on public.feature_flags
for select
using (true);

drop policy if exists "Admin manage feature flags" on public.feature_flags;
create policy "Admin manage feature flags" on public.feature_flags
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

insert into public.feature_flags (key, enabled)
values
  ('chat_enabled', true),
  ('signup_enabled', true),
  ('products_enabled', true),
  ('blog_enabled', true),
  ('analytics_enabled', false)
on conflict (key) do nothing;

-- Moderation queue.
create table if not exists public.moderation_items (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_moderation_items_status_created
on public.moderation_items (status, created_at desc);

alter table public.moderation_items enable row level security;

drop policy if exists "Support/Admin read moderation items" on public.moderation_items;
create policy "Support/Admin read moderation items" on public.moderation_items
for select
using (public.has_role(array['support_agent', 'admin', 'super_admin']));

drop policy if exists "Support/Admin manage moderation items" on public.moderation_items;
create policy "Support/Admin manage moderation items" on public.moderation_items
for all
using (public.has_role(array['support_agent', 'admin', 'super_admin']))
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- Press / updates feed.
create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  content_markdown text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists updates_set_updated_at on public.updates;
create trigger updates_set_updated_at
before update on public.updates
for each row
execute function public.set_updated_at();

create index if not exists idx_updates_published_at
on public.updates (published_at desc nulls last);

alter table public.updates enable row level security;

drop policy if exists "Public can read published updates" on public.updates;
create policy "Public can read published updates" on public.updates
for select
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

drop policy if exists "Admin manage updates" on public.updates;
create policy "Admin manage updates" on public.updates
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

-- Status page data.
create table if not exists public.system_status (
  id boolean primary key default true check (id = true),
  current_status text not null default 'operational' check (current_status in ('operational', 'degraded', 'outage', 'maintenance')),
  message text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists system_status_set_updated_at on public.system_status;
create trigger system_status_set_updated_at
before update on public.system_status
for each row
execute function public.set_updated_at();

insert into public.system_status (id, current_status, message)
values (true, 'operational', 'All systems operational')
on conflict (id) do nothing;

alter table public.system_status enable row level security;

drop policy if exists "Public can read system status" on public.system_status;
create policy "Public can read system status" on public.system_status
for select
using (true);

drop policy if exists "Admin manage system status" on public.system_status;
create policy "Admin manage system status" on public.system_status
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

create table if not exists public.status_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text not null,
  severity text not null default 'minor' check (severity in ('info', 'minor', 'major', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  published boolean not null default false,
  incident_date timestamptz not null default now(),
  resolved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists status_incidents_set_updated_at on public.status_incidents;
create trigger status_incidents_set_updated_at
before update on public.status_incidents
for each row
execute function public.set_updated_at();

create index if not exists idx_status_incidents_incident_date
on public.status_incidents (incident_date desc);

alter table public.status_incidents enable row level security;

drop policy if exists "Public can read published incidents" on public.status_incidents;
create policy "Public can read published incidents" on public.status_incidents
for select
using (published = true);

drop policy if exists "Admin manage incidents" on public.status_incidents;
create policy "Admin manage incidents" on public.status_incidents
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

-- Blog upgrades.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

alter table public.categories enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
for select
using (true);

drop policy if exists "Admin manage categories" on public.categories;
create policy "Admin manage categories" on public.categories
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

drop policy if exists "Public can read tags" on public.tags;
create policy "Public can read tags" on public.tags
for select
using (true);

drop policy if exists "Admin manage tags" on public.tags;
create policy "Admin manage tags" on public.tags
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

alter table public.post_tags enable row level security;

drop policy if exists "Public can read post tags" on public.post_tags;
create policy "Public can read post tags" on public.post_tags
for select
using (true);

drop policy if exists "Admin manage post tags" on public.post_tags;
create policy "Admin manage post tags" on public.post_tags
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

alter table public.posts
add column if not exists meta_title text,
add column if not exists meta_description text,
add column if not exists og_image_url text,
add column if not exists canonical_url text,
add column if not exists publish_at timestamptz,
add column if not exists category_id uuid references public.categories(id) on delete set null;

update public.posts
set publish_at = coalesce(publish_at, published_at);

alter table public.posts
drop constraint if exists posts_status_check;

alter table public.posts
add constraint posts_status_check check (status in ('draft', 'scheduled', 'published'));

create index if not exists idx_posts_publish_at on public.posts (publish_at desc nulls last);
create index if not exists idx_posts_category_id on public.posts (category_id);

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts
for select
using (
  (status = 'published')
  or (status = 'scheduled' and publish_at is not null and publish_at <= now())
);

drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

-- Product status normalization for draft/live workflow.
update public.products
set status = 'live'
where status = 'published';

alter table public.products
drop constraint if exists products_status_check;

alter table public.products
add constraint products_status_check check (status in ('draft', 'live'));

-- Chat upgrades.
alter table public.conversations
add column if not exists assigned_to uuid references auth.users(id) on delete set null,
add column if not exists last_message_preview text,
add column if not exists unread_count_user integer not null default 0,
add column if not exists unread_count_admin integer not null default 0;

update public.conversations
set status = 'closed'
where status = 'resolved';

alter table public.conversations
drop constraint if exists conversations_status_check;

alter table public.conversations
add constraint conversations_status_check check (status in ('open', 'closed'));

create index if not exists idx_conversations_assigned_to on public.conversations (assigned_to);
create index if not exists idx_conversations_unread_admin on public.conversations (unread_count_admin desc, last_message_at desc);

alter table public.messages
add column if not exists attachments jsonb not null default '[]'::jsonb;

create index if not exists idx_messages_unread
on public.messages (conversation_id, read_at, created_at desc);

drop policy if exists "Admins can read all conversations" on public.conversations;
create policy "Admins can read all conversations" on public.conversations
for select
using (public.has_role(array['support_agent', 'admin', 'super_admin']));

drop policy if exists "Admins can update all conversations" on public.conversations;
create policy "Admins can update all conversations" on public.conversations
for update
using (public.has_role(array['support_agent', 'admin', 'super_admin']))
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));

drop policy if exists "Admins can read all messages" on public.messages;
create policy "Admins can read all messages" on public.messages
for select
using (public.has_role(array['support_agent', 'admin', 'super_admin']));

drop policy if exists "Admins can send messages" on public.messages;
create policy "Admins can send messages" on public.messages
for insert
with check (
  sender_role = 'admin'
  and sender_id = auth.uid()
  and public.has_role(array['support_agent', 'admin', 'super_admin'])
);

drop policy if exists "Admins can update messages" on public.messages;
create policy "Admins can update messages" on public.messages
for update
using (public.has_role(array['support_agent', 'admin', 'super_admin']))
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- Attachment bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  5242880,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'application/json',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated can upload chat attachments" on storage.objects;
create policy "Authenticated can upload chat attachments" on storage.objects
for insert
to authenticated
with check (bucket_id = 'chat-attachments');

drop policy if exists "Authenticated can read chat attachments" on storage.objects;
create policy "Authenticated can read chat attachments" on storage.objects
for select
to authenticated
using (bucket_id = 'chat-attachments');

-- Canned replies.
create table if not exists public.canned_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists canned_replies_set_updated_at on public.canned_replies;
create trigger canned_replies_set_updated_at
before update on public.canned_replies
for each row
execute function public.set_updated_at();

alter table public.canned_replies enable row level security;

drop policy if exists "Support/Admin manage canned replies" on public.canned_replies;
create policy "Support/Admin manage canned replies" on public.canned_replies
for all
using (public.has_role(array['support_agent', 'admin', 'super_admin']))
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- Notification outbox.
create table if not exists public.notifications_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_notifications_outbox_status_created
on public.notifications_outbox (status, created_at asc);

alter table public.notifications_outbox enable row level security;

drop policy if exists "Authenticated can enqueue notifications" on public.notifications_outbox;
create policy "Authenticated can enqueue notifications" on public.notifications_outbox
for insert
to authenticated
with check (true);

drop policy if exists "Support/Admin manage notification outbox" on public.notifications_outbox;
create policy "Support/Admin manage notification outbox" on public.notifications_outbox
for all
using (public.has_role(array['support_agent', 'admin', 'super_admin']))
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- Abuse events and auto-ban support.
create table if not exists public.abuse_events (
  id uuid primary key default gen_random_uuid(),
  ip text,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  count integer not null default 0 check (count >= 0),
  window_reset_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ip, user_id, type)
);

drop trigger if exists abuse_events_set_updated_at on public.abuse_events;
create trigger abuse_events_set_updated_at
before update on public.abuse_events
for each row
execute function public.set_updated_at();

create index if not exists idx_abuse_events_user_type
on public.abuse_events (user_id, type);

alter table public.abuse_events enable row level security;

drop policy if exists "Authenticated can write abuse events" on public.abuse_events;
create policy "Authenticated can write abuse events" on public.abuse_events
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update abuse events" on public.abuse_events;
create policy "Authenticated can update abuse events" on public.abuse_events
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Support/Admin read abuse events" on public.abuse_events;
create policy "Support/Admin read abuse events" on public.abuse_events
for select
using (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- User devices (lightweight fingerprint tracking).
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  user_agent text,
  platform text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists idx_user_devices_user_last_seen
on public.user_devices (user_id, last_seen_at desc);

alter table public.user_devices enable row level security;

drop policy if exists "Users manage own devices" on public.user_devices;
create policy "Users manage own devices" on public.user_devices
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Support/Admin read devices" on public.user_devices;
create policy "Support/Admin read devices" on public.user_devices
for select
using (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- Privacy requests.
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('export', 'delete')),
  status text not null default 'pending' check (status in ('pending', 'in_review', 'completed', 'rejected')),
  notes text,
  processed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists privacy_requests_set_updated_at on public.privacy_requests;
create trigger privacy_requests_set_updated_at
before update on public.privacy_requests
for each row
execute function public.set_updated_at();

create index if not exists idx_privacy_requests_user_created
on public.privacy_requests (user_id, created_at desc);

alter table public.privacy_requests enable row level security;

drop policy if exists "Users can read own privacy requests" on public.privacy_requests;
create policy "Users can read own privacy requests" on public.privacy_requests
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own privacy requests" on public.privacy_requests;
create policy "Users can create own privacy requests" on public.privacy_requests
for insert
with check (auth.uid() = user_id);

drop policy if exists "Support/Admin manage privacy requests" on public.privacy_requests;
create policy "Support/Admin manage privacy requests" on public.privacy_requests
for all
using (public.has_role(array['support_agent', 'admin', 'super_admin']))
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));

-- Complaints expansion for public DMCA/legal complaints.
alter table public.complaints
alter column user_id drop not null;

alter table public.complaints
add column if not exists reporter_name text,
add column if not exists reporter_email text,
add column if not exists complaint_type text,
add column if not exists urls text[] not null default '{}',
add column if not exists source text not null default 'user_portal';

drop policy if exists "Public can submit complaints" on public.complaints;
create policy "Public can submit complaints" on public.complaints
for insert
to anon, authenticated
with check (
  user_id is null or user_id = auth.uid()
);

drop policy if exists "Support/Admin read complaints" on public.complaints;
create policy "Support/Admin read complaints" on public.complaints
for select
using (public.has_role(array['support_agent', 'admin', 'super_admin']));

drop policy if exists "Support/Admin update complaints" on public.complaints;
create policy "Support/Admin update complaints" on public.complaints
for update
using (public.has_role(array['support_agent', 'admin', 'super_admin']))
with check (public.has_role(array['support_agent', 'admin', 'super_admin']));
