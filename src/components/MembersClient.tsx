"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FOUNDER_STAGES, displayName, initials, type Profile } from "@/lib/types";

export default function MembersClient({
  members,
  currentUserId,
}: {
  members: Profile[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (stage && m.stage !== stage) return false;
      if (!q) return true;
      const haystack = [
        m.first_name,
        m.last_name,
        m.company,
        m.title,
        m.industry,
        m.location,
        m.looking_for,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [members, query, stage]);

  // Only offer stages that someone actually uses, plus keep order stable.
  const usedStages = FOUNDER_STAGES.filter((s) =>
    members.some((m) => m.stage === s),
  );

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company, industry, or location…"
          className="field flex-1"
        />
        {usedStages.length > 0 && (
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="field w-auto"
          >
            <option value="">All stages</option>
            {usedStages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="mt-3 text-sm text-stone-500">
        {filtered.length} member{filtered.length === 1 ? "" : "s"}
      </p>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <li key={m.id}>
            <Link
              href={`/members/${m.id}`}
              className="card flex h-full flex-col p-4 transition hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark">
                  {initials(m)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {displayName(m)}
                    {m.id === currentUserId && (
                      <span className="ml-1.5 text-xs font-normal text-stone-400">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-stone-600">
                    {[m.title, m.company].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.stage && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-dark">
                    {m.stage}
                  </span>
                )}
                {m.industry && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    {m.industry}
                  </span>
                )}
                {m.location && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    📍 {m.location}
                  </span>
                )}
              </div>

              {m.looking_for && (
                <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                  <span className="font-medium text-stone-700">Needs:</span>{" "}
                  {m.looking_for}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-8 text-sm text-stone-500">
          No members match your search.
        </p>
      )}
    </div>
  );
}
