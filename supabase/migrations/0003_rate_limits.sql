create table if not exists public.rate_limits (
  rate_key text not null,
  bucket text not null,
  window_seconds integer not null check (window_seconds > 0),
  count integer not null default 0 check (count >= 0),
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (rate_key, bucket, window_seconds)
);

create index if not exists idx_rate_limits_updated_at on public.rate_limits (updated_at);

alter table public.rate_limits enable row level security;

revoke all on table public.rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(
  p_rate_key text,
  p_bucket text,
  p_limit integer,
  p_window_seconds integer,
  p_increment integer default 1,
  p_reset boolean default false
)
returns table (
  allowed boolean,
  current_count integer,
  remaining integer,
  retry_after_seconds integer,
  window_started_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  now_ts timestamptz := now();
  rate_row public.rate_limits%rowtype;
  window_ends_at timestamptz;
  safe_increment integer := greatest(coalesce(p_increment, 1), 0);
begin
  if p_limit <= 0 then
    raise exception 'p_limit must be > 0';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be > 0';
  end if;

  insert into public.rate_limits (
    rate_key,
    bucket,
    window_seconds,
    count,
    window_started_at,
    updated_at
  )
  values (
    p_rate_key,
    p_bucket,
    p_window_seconds,
    0,
    now_ts,
    now_ts
  )
  on conflict (rate_key, bucket, window_seconds) do nothing;

  select *
  into rate_row
  from public.rate_limits
  where rate_key = p_rate_key
    and bucket = p_bucket
    and window_seconds = p_window_seconds
  for update;

  if rate_row.window_started_at + make_interval(secs => p_window_seconds) <= now_ts then
    rate_row.count := 0;
    rate_row.window_started_at := now_ts;
  end if;

  if p_reset then
    rate_row.count := 0;
    rate_row.window_started_at := now_ts;
  else
    rate_row.count := rate_row.count + safe_increment;
  end if;

  update public.rate_limits
  set count = rate_row.count,
      window_started_at = rate_row.window_started_at,
      updated_at = now_ts
  where rate_key = p_rate_key
    and bucket = p_bucket
    and window_seconds = p_window_seconds;

  window_ends_at := rate_row.window_started_at + make_interval(secs => p_window_seconds);

  allowed := rate_row.count <= p_limit;
  current_count := rate_row.count;
  remaining := greatest(p_limit - rate_row.count, 0);
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (window_ends_at - now_ts)))::integer)
  end;
  window_started_at := rate_row.window_started_at;

  return next;
end;
$$;

grant execute on function public.check_rate_limit(text, text, integer, integer, integer, boolean)
to anon, authenticated;
