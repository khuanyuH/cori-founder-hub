import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMBED_BATCH,
  contactEmbedText,
  embedDocuments,
} from "@/lib/embeddings";

type Row = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Embed the given contact rows (via Voyage) and store the vectors in one RPC
// call per batch. Returns how many were embedded. Requires VOYAGE_API_KEY.
export async function embedAndStore(
  admin: SupabaseClient,
  rows: Row[],
): Promise<number> {
  let stored = 0;
  for (const batch of chunk(rows, EMBED_BATCH)) {
    const texts = batch.map(contactEmbedText);
    const vectors = await embedDocuments(texts);
    const payload = batch.map((r, i) => ({ id: r.id, embedding: vectors[i] }));
    const { error } = await admin.rpc("set_contact_embeddings", {
      p: payload,
    });
    if (error) throw new Error(error.message);
    stored += batch.length;
  }
  return stored;
}

// Embed any contacts (within an optional id set) that don't have an embedding
// yet. Used by the import path (scoped to the upload) and the backfill route.
export async function embedMissing(
  admin: SupabaseClient,
  opts: { ids?: string[]; limit?: number } = {},
): Promise<{ embedded: number; remaining: number }> {
  let query = admin
    .from("contacts")
    .select("id, first_name, last_name, company, position")
    .is("embedding", null)
    .limit(opts.limit ?? 1000);
  if (opts.ids && opts.ids.length > 0) query = query.in("id", opts.ids);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return { embedded: 0, remaining: 0 };

  const embedded = await embedAndStore(admin, rows);

  // How many are still missing (within the same scope)?
  let countQuery = admin
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .is("embedding", null);
  if (opts.ids && opts.ids.length > 0) countQuery = countQuery.in("id", opts.ids);
  const { count } = await countQuery;

  return { embedded, remaining: count ?? 0 };
}
