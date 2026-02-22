create extension if not exists pgcrypto;

-- Normalize profile roles to user/admin/super_admin.
update public.profiles
set role = 'admin'
where role in ('editor', 'support');

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check check (role in ('user', 'admin', 'super_admin'));

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
for select
using (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Super admin can update any profile" on public.profiles;
create policy "Super admin can update any profile" on public.profiles
for update
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

-- Align admin CMS policies with admin/super_admin roles.
drop policy if exists "Editors manage products" on public.products;
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Editors manage posts" on public.posts;
drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Editors manage product post links" on public.product_post_links;
drop policy if exists "Admins manage product post links" on public.product_post_links;
create policy "Admins manage product post links" on public.product_post_links
for all
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Admin and support can read contacts" on public.contact_messages;
drop policy if exists "Admin can read contacts" on public.contact_messages;
create policy "Admin can read contacts" on public.contact_messages
for select
using (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Admin and support can insert audit log" on public.audit_log;
drop policy if exists "Admin can insert audit log" on public.audit_log;
create policy "Admin can insert audit log" on public.audit_log
for insert
with check (public.has_role(array['admin', 'super_admin']));

-- Products model update: add description and use draft/published status.
alter table public.products
add column if not exists description text;

update public.products
set description = coalesce(description, short_description);

alter table public.products
alter column description set not null;

alter table public.products
drop constraint if exists products_status_check;

update public.products
set status = case
  when status in ('published', 'live', 'active', 'beta') then 'published'
  else 'draft'
end;

alter table public.products
add constraint products_status_check check (status in ('draft', 'published'));

alter table public.products
alter column status set default 'draft';

-- Posts model update: keep simple draft/published lifecycle.
alter table public.posts
drop constraint if exists posts_status_check;

update public.posts
set status = case
  when status = 'published' then 'published'
  else 'draft'
end;

alter table public.posts
add constraint posts_status_check check (status in ('draft', 'published'));

alter table public.posts
alter column status set default 'draft';

-- Optional newsletter subscribers table.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists newsletter_subscribers_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_updated_at
before update on public.newsletter_subscribers
for each row
execute function public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Anyone can subscribe newsletter" on public.newsletter_subscribers;
create policy "Anyone can subscribe newsletter" on public.newsletter_subscribers
for insert
to anon, authenticated
with check (status in ('active', 'unsubscribed'));

drop policy if exists "Super admin can read newsletter subscribers" on public.newsletter_subscribers;
create policy "Super admin can read newsletter subscribers" on public.newsletter_subscribers
for select
using (public.has_role(array['super_admin']));

drop policy if exists "Super admin can update newsletter subscribers" on public.newsletter_subscribers;
create policy "Super admin can update newsletter subscribers" on public.newsletter_subscribers
for update
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

-- New conversation/message model for user chat + admin inbox.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'resolved')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

create index if not exists idx_conversations_user_last_message
on public.conversations (user_id, last_message_at desc);

create index if not exists idx_conversations_last_message
on public.conversations (last_message_at desc);

create unique index if not exists idx_conversations_single_open_per_user
on public.conversations (user_id)
where status = 'open';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_messages_conversation_created_at
on public.messages (conversation_id, created_at desc);

create index if not exists idx_messages_sender
on public.messages (sender_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can read own conversations" on public.conversations;
create policy "Users can read own conversations" on public.conversations
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own conversations" on public.conversations;
create policy "Users can create own conversations" on public.conversations
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own conversations" on public.conversations;
create policy "Users can update own conversations" on public.conversations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins can read all conversations" on public.conversations;
create policy "Admins can read all conversations" on public.conversations
for select
using (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Admins can update all conversations" on public.conversations;
create policy "Admins can update all conversations" on public.conversations
for update
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Users can read own messages" on public.messages;
create policy "Users can read own messages" on public.messages
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can send own messages" on public.messages;
create policy "Users can send own messages" on public.messages
for insert
with check (
  sender_role = 'user'
  and sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Admins can read all messages" on public.messages;
create policy "Admins can read all messages" on public.messages
for select
using (public.has_role(array['admin', 'super_admin']));

drop policy if exists "Admins can send messages" on public.messages;
create policy "Admins can send messages" on public.messages
for insert
with check (
  sender_role = 'admin'
  and sender_id = auth.uid()
  and public.has_role(array['admin', 'super_admin'])
);

drop policy if exists "Admins can update messages" on public.messages;
create policy "Admins can update messages" on public.messages
for update
using (public.has_role(array['admin', 'super_admin']))
with check (public.has_role(array['admin', 'super_admin']));

-- Backfill existing thread/message data into new tables when available.
insert into public.conversations (id, user_id, status, last_message_at, created_at, updated_at)
select
  t.id,
  t.user_id,
  case when t.status = 'closed' then 'resolved' else 'open' end as status,
  coalesce((
    select max(m.created_at)
    from public.chat_messages m
    where m.thread_id = t.id
  ), t.created_at) as last_message_at,
  t.created_at,
  now()
from public.chat_threads t
on conflict (id) do nothing;

insert into public.messages (id, conversation_id, sender_role, sender_id, body, created_at)
select
  m.id,
  m.thread_id as conversation_id,
  case when m.sender_id = t.user_id then 'user' else 'admin' end as sender_role,
  m.sender_id,
  m.message as body,
  m.created_at
from public.chat_messages m
join public.chat_threads t on t.id = m.thread_id
on conflict (id) do nothing;

update public.conversations c
set
  last_message_at = latest.max_created_at,
  updated_at = now()
from (
  select conversation_id, max(created_at) as max_created_at
  from public.messages
  group by conversation_id
) latest
where c.id = latest.conversation_id;
