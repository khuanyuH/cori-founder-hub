import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CleanContact } from "@/lib/csv";

// Upserts send rows in the request BODY, so a large batch is fine.
const BATCH = 500;
// The id-resolution select filters with `.in('dedup_key', [...])`, which goes in
// the URL. LinkedIn URLs are long, so keep this batch small to avoid building a
// multi-KB query string that fails with "fetch failed".
const SELECT_BATCH = 100;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(request: NextRequest) {
  // 1. Authenticate and require an approved member (via the user's session).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();
  if (profile?.status !== "approved") {
    return NextResponse.json({ error: "Not approved" }, { status: 403 });
  }

  // 2. Validate payload.
  let body: { contacts?: CleanContact[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const incoming = (body.contacts ?? []).filter(
    (c) => c && c.dedup_key && c.first_name && c.last_name,
  );
  if (incoming.length === 0) {
    return NextResponse.json(
      { newContacts: 0, newConnections: 0, alreadyKnown: 0 },
      { status: 200 },
    );
  }

  // De-dupe by dedup_key within the payload (defensive; client already does it).
  const byKey = new Map<string, CleanContact>();
  for (const c of incoming) byKey.set(c.dedup_key, c);
  const contacts = [...byKey.values()];

  // The service-role client bypasses RLS for these bulk writes.
  const admin = createAdminClient();

  // 3a. Bulk-upsert contacts ON CONFLICT (dedup_key) DO NOTHING. With
  // ignoreDuplicates, .select() returns only the rows actually inserted.
  let newContacts = 0;
  for (const batch of chunk(contacts, BATCH)) {
    const { data, error } = await admin
      .from("contacts")
      .upsert(batch, { onConflict: "dedup_key", ignoreDuplicates: true })
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    newContacts += data?.length ?? 0;
  }

  // 3b. Resolve all contact ids for this upload by dedup_key (new + existing).
  const allKeys = contacts.map((c) => c.dedup_key);
  const idByKey = new Map<string, string>();
  for (const batch of chunk(allKeys, SELECT_BATCH)) {
    const { data, error } = await admin
      .from("contacts")
      .select("id, dedup_key")
      .in("dedup_key", batch);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    for (const row of data ?? []) idByKey.set(row.dedup_key, row.id);
  }

  // 3c. Bulk-insert edges into connections (member_id = current user) ON
  // CONFLICT (member_id, contact_id) DO NOTHING. .select() returns only the
  // newly inserted edges, so its length is the count of brand-new connections.
  const edges = [...idByKey.values()].map((contact_id) => ({
    member_id: user.id,
    contact_id,
  }));
  const uniqueContacts = edges.length;

  let newConnections = 0;
  for (const batch of chunk(edges, BATCH)) {
    const { data, error } = await admin
      .from("connections")
      .upsert(batch, {
        onConflict: "member_id,contact_id",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    newConnections += data?.length ?? 0;
  }

  const alreadyKnown = uniqueContacts - newConnections;

  return NextResponse.json({ newContacts, newConnections, alreadyKnown });
}
