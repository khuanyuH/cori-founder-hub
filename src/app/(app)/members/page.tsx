import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import MembersClient from "@/components/MembersClient";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const { userId } = await requireApproved();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, company, title, location, industry, stage, looking_for, website, linkedin_url, bio",
    )
    .eq("status", "approved")
    .order("first_name", { ascending: true });

  const members = (data ?? []) as Profile[];

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-ink">Members</h1>
      <p className="mt-1 text-sm text-stone-600">
        The founders, mentors, and staff in the CORI network. Reach out, compare
        notes, and find people building alongside you.
      </p>
      <MembersClient members={members} currentUserId={userId} />
    </div>
  );
}
