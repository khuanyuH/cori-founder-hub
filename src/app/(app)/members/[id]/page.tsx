import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_EMOJI,
  displayName,
  initials,
  type PostCategory,
  type Profile,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function ExternalLink({ href, label }: { href: string; label: string }) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-brand hover:underline"
    >
      {label} ↗
    </a>
  );
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireApproved();
  const { id } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!member) notFound();
  const m = member as Profile;

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, category, created_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl">
      <Link href="/members" className="text-sm text-stone-500 hover:text-ink">
        ← Back to members
      </Link>

      <div className="card mt-4 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-dark">
            {initials(m)}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-ink">
              {displayName(m)}
              {m.id === userId && (
                <span className="ml-2 align-middle text-sm font-normal text-stone-400">
                  (you)
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-stone-600">
              {[m.title, m.company].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.stage && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-dark">
                  {m.stage}
                </span>
              )}
              {m.industry && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">
                  {m.industry}
                </span>
              )}
              {m.location && (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">
                  📍 {m.location}
                </span>
              )}
            </div>
          </div>
          {m.id === userId && (
            <Link href="/profile" className="btn-secondary ml-auto shrink-0">
              Edit
            </Link>
          )}
        </div>

        {m.bio && (
          <div className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Working on
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
              {m.bio}
            </p>
          </div>
        )}

        {m.looking_for && (
          <div className="mt-4 rounded-lg bg-brand-50 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Looking for help with
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
              {m.looking_for}
            </p>
          </div>
        )}

        {(m.website || m.linkedin_url) && (
          <div className="mt-4 flex flex-wrap gap-4">
            {m.website && <ExternalLink href={m.website} label="Website" />}
            {m.linkedin_url && (
              <ExternalLink href={m.linkedin_url} label="LinkedIn" />
            )}
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Posts by {displayName(m).split(" ")[0]}
        </h2>
        {(posts ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No posts yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(posts ?? []).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/forum/${p.id}`}
                  className="card flex items-center gap-2 px-4 py-3 text-sm transition hover:shadow-md"
                >
                  <span>{CATEGORY_EMOJI[p.category as PostCategory]}</span>
                  <span className="font-medium text-ink">{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
