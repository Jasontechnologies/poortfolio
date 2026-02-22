create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'support')),
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  short_description text not null,
  status text not null default 'active' check (status in ('active', 'beta', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title text not null,
  details text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'new' check (status in ('new', 'in_review', 'resolved')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table complaints enable row level security;

create policy "Users can read own profile" on profiles
for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
for update using (auth.uid() = id);

create policy "Users can read own threads" on chat_threads
for select using (auth.uid() = user_id);

create policy "Users can create own threads" on chat_threads
for insert with check (auth.uid() = user_id);

create policy "Users can read own chat messages" on chat_messages
for select using (
  exists (
    select 1 from chat_threads t
    where t.id = chat_messages.thread_id
      and t.user_id = auth.uid()
  )
);

create policy "Users can insert own chat messages" on chat_messages
for insert with check (auth.uid() = sender_id);

create policy "Users can read own complaints" on complaints
for select using (auth.uid() = user_id);

create policy "Users can insert own complaints" on complaints
for insert with check (auth.uid() = user_id);
