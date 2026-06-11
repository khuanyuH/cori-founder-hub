-- CORI Network — semantic search over contacts with pgvector
-- Run AFTER 0004. Embeddings are produced by Voyage AI (voyage-3.5-lite,
-- 1024 dimensions) from the app and stored here.

create extension if not exists vector;

-- 1024-dim embedding for each contact (name · title · company).
alter table public.contacts
  add column if not exists embedding vector(1024);

-- Approximate-nearest-neighbour index for cosine distance.
create index if not exists contacts_embedding_idx
  on public.contacts using hnsw (embedding vector_cosine_ops);

-- Semantic match. SECURITY INVOKER (default) so the caller's RLS on contacts
-- still applies — only approved members get results.
create or replace function public.match_contacts(
  query_embedding vector(1024),
  match_count int default 30
)
returns table (
  id           uuid,
  first_name   text,
  last_name    text,
  company      text,
  "position"   text,
  linkedin_url text,
  similarity   float
)
language sql
stable
as $$
  select
    c.id, c.first_name, c.last_name, c.company, c.position, c.linkedin_url,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.contacts c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_contacts(vector, int) to authenticated;

-- Bulk-store embeddings: takes [{ "id": uuid, "embedding": [..1024 floats..] }].
-- The JSON array text "[0.1,0.2,…]" casts straight to vector. Called only by
-- the service-role import/backfill path.
create or replace function public.set_contact_embeddings(p jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.contacts c
  set embedding = ((e->>'embedding'))::vector
  from jsonb_array_elements(p) as e
  where c.id = (e->>'id')::uuid;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function public.set_contact_embeddings(jsonb) to service_role;
