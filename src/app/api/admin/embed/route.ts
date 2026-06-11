import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embeddingsEnabled } from "@/lib/embeddings";
import { embedMissing } from "@/lib/embed-contacts";

export const dynamic = "force-dynamic";
// Embedding a chunk can take a while; give it room.
export const maxDuration = 60;

// Admin-only backfill: embeds contacts that don't have a vector yet, a chunk at
// a time. Call repeatedly until `remaining` is 0. POST { limit?: number }.
export async function POST(request: Request) {
  if (!embeddingsEnabled()) {
    return NextResponse.json(
      { error: "VOYAGE_API_KEY is not set" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  let limit = 256;
  try {
    const body = await request.json();
    if (typeof body?.limit === "number") limit = Math.min(body.limit, 512);
  } catch {
    // no body — use default
  }

  try {
    const admin = createAdminClient();
    const result = await embedMissing(admin, { limit });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "embedding failed" },
      { status: 500 },
    );
  }
}
