import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import AdminApprovals from "@/components/AdminApprovals";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });

  const profiles = (data ?? []) as Profile[];
  const pending = profiles.filter((p) => p.status === "pending");
  const approved = profiles.filter((p) => p.status === "approved");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-slate-600">
        Approve new members. Approved members can access the forum and directory.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pending ({pending.length})
        </h2>
        <AdminApprovals profiles={pending} mode="pending" />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Approved ({approved.length})
        </h2>
        <AdminApprovals profiles={approved} mode="approved" />
      </section>
    </div>
  );
}
