"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { IntroStatus } from "@/lib/types";

export type InboxItem = {
  id: string;
  message: string | null;
  status: IntroStatus;
  created_at: string;
  requesterName: string;
  contactName: string;
};

const statusStyles: Record<IntroStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  declined: "bg-slate-200 text-slate-600",
  completed: "bg-green-100 text-green-800",
};

// Inbox of introduction requests where the current user is the connector.
export default function IntroInbox({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: IntroStatus) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("intro_requests")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (!error) router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="mt-3 text-sm text-slate-500">
        No introduction requests yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-3">
      {items.map((it) => (
        <li
          key={it.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm text-slate-900">
                <span className="font-medium">{it.requesterName}</span> wants an
                intro to{" "}
                <span className="font-medium">{it.contactName}</span>
              </p>
              {it.message && (
                <p className="mt-1 text-sm text-slate-600">
                  &ldquo;{it.message}&rdquo;
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[it.status]}`}
            >
              {it.status}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {it.status === "pending" && (
              <>
                <button
                  onClick={() => setStatus(it.id, "accepted")}
                  disabled={busyId === it.id}
                  className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  onClick={() => setStatus(it.id, "declined")}
                  disabled={busyId === it.id}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  Decline
                </button>
              </>
            )}
            {it.status === "accepted" && (
              <button
                onClick={() => setStatus(it.id, "completed")}
                disabled={busyId === it.id}
                className="rounded-md border border-green-600 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
              >
                Mark completed
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
