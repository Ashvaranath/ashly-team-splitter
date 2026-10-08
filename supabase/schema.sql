-- Run this once in Supabase → SQL Editor → New query → Run

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  squad jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint ratings_user_id_unique unique (user_id)
);

alter table public.ratings enable row level security;

drop policy if exists "Users can read own ratings" on public.ratings;
create policy "Users can read own ratings"
  on public.ratings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ratings" on public.ratings;
create policy "Users can insert own ratings"
  on public.ratings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ratings" on public.ratings;
create policy "Users can update own ratings"
  on public.ratings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
