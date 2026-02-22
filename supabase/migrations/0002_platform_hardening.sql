create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = any(required_roles)
  );
$$;

update profiles
set role = 'super_admin'
where role = 'admin';

alter table profiles
drop constraint if exists profiles_role_check;

alter table profiles
add constraint profiles_role_check check (
  role in ('user', 'super_admin', 'editor', 'support')
);

alter table products
add column if not exists landing_url text,
add column if not exists logo_url text,
add column if not exists sort_order integer not null default 100,
add column if not exists updated_at timestamptz not null default now();

update products
set status = case
  when status in ('active', 'beta') then 'live'
  else 'draft'
end;

alter table products
drop constraint if exists products_status_check;

alter table products
add constraint products_status_check check (status in ('draft', 'live'));

alter table products
alter column status set default 'draft';

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
before update on products
for each row
execute function public.set_updated_at();

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content_markdown text not null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  published_at timestamptz,
  tags text[] not null default '{}',
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at
before update on posts
for each row
execute function public.set_updated_at();

create table if not exists product_post_links (
  product_id uuid not null references products(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, post_id)
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  ip_hash text,
  fingerprint_hash text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  target_table text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table posts enable row level security;
alter table product_post_links enable row level security;
alter table contact_messages enable row level security;
alter table audit_log enable row level security;

drop policy if exists "Public can read live products" on products;
create policy "Public can read live products" on products
for select using (status = 'live');

drop policy if exists "Editors manage products" on products;
create policy "Editors manage products" on products
for all
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "Public can read published posts" on posts;
create policy "Public can read published posts" on posts
for select
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

drop policy if exists "Editors manage posts" on posts;
create policy "Editors manage posts" on posts
for all
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "Public can read product post links" on product_post_links;
create policy "Public can read product post links" on product_post_links
for select
using (true);

drop policy if exists "Editors manage product post links" on product_post_links;
create policy "Editors manage product post links" on product_post_links
for all
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "Anyone can insert contacts" on contact_messages;
create policy "Anyone can insert contacts" on contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admin and support can read contacts" on contact_messages;
create policy "Admin and support can read contacts" on contact_messages
for select
using (public.has_role(array['super_admin', 'support']));

drop policy if exists "Admin and support can insert audit log" on audit_log;
create policy "Admin and support can insert audit log" on audit_log
for insert
with check (public.has_role(array['super_admin', 'editor', 'support']));

drop policy if exists "Super admin can read audit log" on audit_log;
create policy "Super admin can read audit log" on audit_log
for select
using (public.has_role(array['super_admin']));

drop policy if exists "Users can create own threads" on chat_threads;
create policy "Users can create own threads" on chat_threads
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  )
  and (
    select count(*)
    from chat_threads t
    where t.user_id = auth.uid()
      and t.status = 'open'
  ) < 3
);

drop policy if exists "Users can insert own chat messages" on chat_messages;
create policy "Users can insert own chat messages" on chat_messages
for insert
with check (
  auth.uid() = sender_id
  and thread_id is not null
  and exists (
    select 1
    from chat_threads t
    where t.id = chat_messages.thread_id
      and t.user_id = auth.uid()
  )
  and exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  )
  and not exists (
    select 1
    from chat_messages m
    where m.sender_id = auth.uid()
      and m.created_at > now() - interval '3 seconds'
  )
);
