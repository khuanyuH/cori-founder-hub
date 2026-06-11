-- CORI Network — Row-Level Security, helper functions, and grants
-- Run AFTER 0001_schema.sql.

-- Helper functions ---------------------------------------------------------
-- SECURITY DEFINER so they bypass RLS on profiles and avoid policy recursion
-- (a policy on profiles that itself queries profiles would recurse otherwise).

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- Privilege-escalation guard: a normal logged-in user may not change their
-- own status or is_admin. auth.uid() is null under the service-role key and in
-- the SQL editor, so admin seeding and the service-role approval path still work.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.status is distinct from old.status
      or new.is_admin is distinct from old.is_admin) then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Not authorized to change status or admin flag';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileges on public.profiles;
create trigger trg_guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Enable RLS ---------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.contacts       enable row level security;
alter table public.connections    enable row level security;
alter table public.intro_requests enable row level security;
alter table public.posts          enable row level security;
alter table public.comments       enable row level security;
alter table public.post_votes     enable row level security;

-- profiles -----------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or (public.is_approved() and status = 'approved')
    or public.is_admin()
  );

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- contacts -----------------------------------------------------------------
-- Selectable by approved members. Inserts happen only via the service-role
-- import path (which bypasses RLS), so no insert policy is granted here.
drop policy if exists contacts_select on public.contacts;
create policy contacts_select on public.contacts
  for select using (public.is_approved());

-- connections --------------------------------------------------------------
-- Approved members can read all edges (needed for "Known by").
drop policy if exists connections_select on public.connections;
create policy connections_select on public.connections
  for select using (public.is_approved());

drop policy if exists connections_insert_own on public.connections;
create policy connections_insert_own on public.connections
  for insert with check (public.is_approved() and member_id = auth.uid());

drop policy if exists connections_delete_own on public.connections;
create policy connections_delete_own on public.connections
  for delete using (member_id = auth.uid());

-- intro_requests -----------------------------------------------------------
drop policy if exists intro_requests_select on public.intro_requests;
create policy intro_requests_select on public.intro_requests
  for select using (
    requester_id = auth.uid()
    or connector_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists intro_requests_insert on public.intro_requests;
create policy intro_requests_insert on public.intro_requests
  for insert with check (public.is_approved() and requester_id = auth.uid());

drop policy if exists intro_requests_update on public.intro_requests;
create policy intro_requests_update on public.intro_requests
  for update using (
    requester_id = auth.uid() or connector_id = auth.uid()
  ) with check (
    requester_id = auth.uid() or connector_id = auth.uid()
  );

-- posts --------------------------------------------------------------------
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts
  for select using (public.is_approved());

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts
  for insert with check (public.is_approved() and author_id = auth.uid());

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete using (author_id = auth.uid());

-- comments -----------------------------------------------------------------
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select using (public.is_approved());

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert with check (public.is_approved() and author_id = auth.uid());

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete using (author_id = auth.uid());

-- post_votes ---------------------------------------------------------------
drop policy if exists post_votes_select on public.post_votes;
create policy post_votes_select on public.post_votes
  for select using (public.is_approved());

drop policy if exists post_votes_insert_own on public.post_votes;
create policy post_votes_insert_own on public.post_votes
  for insert with check (public.is_approved() and user_id = auth.uid());

drop policy if exists post_votes_delete_own on public.post_votes;
create policy post_votes_delete_own on public.post_votes
  for delete using (user_id = auth.uid());

-- Grants -------------------------------------------------------------------
-- New Supabase projects require explicit GRANTs for PostgREST to reach tables,
-- in addition to RLS. RLS still governs row visibility; grants govern table
-- reachability. anon gets nothing (everything is gated on an approved profile).
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant execute on function public.is_approved()  to authenticated;
grant execute on function public.is_admin()     to authenticated;
