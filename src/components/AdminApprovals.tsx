"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { displayName, type Profile } from "@/lib/types";

// Admin list of members with approve / revoke actions. Updates run through the
// admin RLS policy (the privilege guard permits status changes by admins).
export default function AdminApprovals({
  profiles,
  mode,
}: {
  profiles: Profile[];
  mode: "pending" | "approved";
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: "approved" | "pending") {
    setBusyId(id);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (error) setError(error.message);
    else router.refresh();
  }

  if (profiles.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-500">
        {mode === "pending" ? "No one is waiting for approval." : "No approved members yet."}
      </p>
    );
  }

  return (
    <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {profiles.map((p) => (
        <li key={p.id} className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {displayName(p)}
              {p.is_admin && (
                <span className="ml-2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  admin
                </span>
              )}
            </p>
            <p className="truncate text-xs text-slate-500">
              {[p.title, p.company].filter(Boolean).join(" · ") || "No company / title set"}
            </p>
          </div>
          {mode === "pending" ? (
            <button
              onClick={() => setStatus(p.id, "approved")}
              disabled={busyId === p.id}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {busyId === p.id ? "…" : "Approve"}
            </button>
          ) : (
            !p.is_admin && (
              <button
                onClick={() => setStatus(p.id, "pending")}
                disabled={busyId === p.id}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                {busyId === p.id ? "…" : "Revoke"}
              </button>
            )
          )}
        </li>
      ))}
      {error && <li className="px-4 py-2 text-sm text-red-600">{error}</li>}
    </ul>
  );
}
