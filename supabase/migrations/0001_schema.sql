-- CORI Network — schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Order matters: run 0001 then 0002 then 0003.

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  company     text,
  title       text,
  bio         text, -- "what I'm working on / what I need"
  status      text not null default 'pending' check (status in ('pending','approved')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- contacts -----------------------------------------------------------------
-- Pooled LinkedIn connections. These people are NOT users.
-- Never store email or phone.
create table if not exists public.contacts (
  id           uuid primary key default gen_random_uuid(),
  first_name   text,
  last_name    text,
  company      text,
  position     text,
  linkedin_url text,
  dedup_key    text unique not null,
  created_at   timestamptz not null default now()
);

-- Full-text search over name/company/position.
alter table public.contacts
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('simple',
      coalesce(first_name,'') || ' ' ||
      coalesce(last_name,'')  || ' ' ||
      coalesce(company,'')    || ' ' ||
      coalesce(position,'')
    )
  ) stored;

create index if not exists contacts_search_tsv_idx
  on public.contacts using gin (search_tsv);

-- connections --------------------------------------------------------------
-- Edges: which member knows which contact.
create table if not exists public.connections (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, contact_id)
);
create index if not exists connections_contact_id_idx on public.connections (contact_id);
create index if not exists connections_member_id_idx on public.connections (member_id);

-- intro_requests -----------------------------------------------------------
create table if not exists public.intro_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  connector_id uuid not null references public.profiles(id) on delete cascade,
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  message      text,
  status       text not null default 'pending' check (status in ('pending','accepted','declined','completed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists intro_requests_requester_idx on public.intro_requests (requester_id);
create index if not exists intro_requests_connector_idx on public.intro_requests (connector_id);

-- posts --------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  category   text not null default 'general' check (category in ('fundraising','hiring','product','legal','general')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- comments -----------------------------------------------------------------
create table if not exists public.comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.posts(id) on delete cascade,
  author_id         uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body              text not null,
  created_at        timestamptz not null default now()
);
create index if not exists comments_post_id_idx on public.comments (post_id);

-- post_votes (upvotes only) ------------------------------------------------
create table if not exists public.post_votes (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  unique (user_id, post_id)
);
create index if not exists post_votes_post_id_idx on public.post_votes (post_id);

-- updated_at trigger for intro_requests & posts ----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_intro_requests_updated_at on public.intro_requests;
create trigger trg_intro_requests_updated_at
  before update on public.intro_requests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
