import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Lightweight health check that also touches the database so a scheduled ping
// (e.g. a GitHub Action) keeps a free-tier Supabase project from pausing.
export async function GET() {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) {
      return NextResponse.json(
        { ok: false, db: false, error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, db: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
