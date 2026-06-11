-- CORI Network — richer member profile fields
-- Run AFTER 0002. Adds optional profile columns. Existing table-level GRANTs
-- and RLS policies automatically cover new columns, so nothing else is needed.

alter table public.profiles
  add column if not exists website      text,
  add column if not exists linkedin_url text,  -- the member's own LinkedIn
  add column if not exists location     text,  -- city / region (rural relevance)
  add column if not exists industry     text,
  add column if not exists stage        text,  -- e.g. idea, pre-seed, seed, series-a, growth
  add column if not exists looking_for  text;  -- "what I need help with right now"
