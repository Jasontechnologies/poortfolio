-- Tiptap storage columns for admin blog editor.
alter table public.posts
add column if not exists content_json jsonb not null default '{}'::jsonb,
add column if not exists content_html text not null default '';

-- Backfill HTML column from existing markdown/plain content when empty.
update public.posts
set content_html = coalesce(nullif(content_html, ''), coalesce(content_markdown, ''))
where coalesce(content_html, '') = '';

