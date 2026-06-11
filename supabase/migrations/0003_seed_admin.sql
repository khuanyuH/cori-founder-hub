-- CORI Network — seed the first admin
--
-- Run this ONCE, AFTER you have signed in to the app at least once with the
-- email you want to be the admin (signing in creates your auth.users row and
-- your pending profile). Replace the email below with yours, then run it in
-- the Supabase SQL Editor.

update public.profiles
set status = 'approved',
    is_admin = true
where id = (
  select id from auth.users
  where lower(email) = lower('CHANGE_ME@example.com')
);

-- Verify:
-- select p.id, u.email, p.status, p.is_admin
-- from public.profiles p join auth.users u on u.id = p.id;
