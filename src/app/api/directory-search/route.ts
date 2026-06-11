import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embeddingsEnabled, embedQuery } from "@/lib/embeddings";

export const dynamic = "force-dynamic";

type ContactRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  linkedin_url: string | null;
};

// Directory search. Prefers semantic (pgvector) search via Voyage embeddings,
// and falls back to Postgres full-text search if embeddings aren't configured
// or return nothing. Runs under the user's session, so contacts RLS applies.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ contacts: [], mode: "none" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Semantic search first.
  if (embeddingsEnabled()) {
    try {
      const embedding = await embedQuery(q);
      const { data, error } = await supabase.rpc("match_contacts", {
        query_embedding: embedding,
        match_count: 40,
      });
      if (!error && data && data.length > 0) {
        const contacts = (data as (ContactRow & { similarity: number })[]).map(
          ({ similarity: _similarity, ...c }) => c,
        );
        return NextResponse.json({ contacts, mode: "semantic" });
      }
    } catch (e) {
      console.error("Semantic search failed, falling back to FTS:", e);
    }
  }

  // Full-text fallback.
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, company, position, linkedin_url")
    .textSearch("search_tsv", q, { type: "websearch", config: "simple" })
    .limit(40);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ contacts: (data ?? []) as ContactRow[], mode: "text" });
}
