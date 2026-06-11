import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { contactName, displayName, pickOne, type IntroStatus } from "@/lib/types";
import IntroInbox, { type InboxItem } from "@/components/IntroInbox";

export const dynamic = "force-dynamic";

const statusStyles: Record<IntroStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  declined: "bg-slate-200 text-slate-600",
  completed: "bg-green-100 text-green-800",
};

export default async function ActivityPage() {
  const { userId } = await requireApproved();
  const supabase = await createClient();

  const [postsRes, commentsRes, sentRes, receivedRes, votesRes] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, category, created_at")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("comments")
        .select("id, body, created_at, post_id, post:posts!post_id(title)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("intro_requests")
        .select(
          "id, message, status, created_at, connector:profiles!connector_id(first_name, last_name), contact:contacts!contact_id(first_name, last_name, company)",
        )
        .eq("requester_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("intro_requests")
        .select(
          "id, message, status, created_at, requester:profiles!requester_id(first_name, last_name), contact:contacts!contact_id(first_name, last_name, company)",
        )
        .eq("connector_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("post_votes")
        .select("post:posts!post_id(id, title, category, created_at)")
        .eq("user_id", userId),
    ]);

  const myPosts = postsRes.data ?? [];
  const myComments = (commentsRes.data ?? []).map((c) => ({
    ...c,
    postTitle: pickOne(c.post)?.title ?? "(deleted post)",
  }));

  const sent = (sentRes.data ?? []).map((r) => ({
    id: r.id,
    status: r.status as IntroStatus,
    connectorName: displayName(pickOne(r.connector)),
    contactName: contactName(pickOne(r.contact)),
  }));

  const received: InboxItem[] = (receivedRes.data ?? []).map((r) => ({
    id: r.id,
    message: r.message,
    status: r.status as IntroStatus,
    created_at: r.created_at,
    requesterName: displayName(pickOne(r.requester)),
    contactName: contactName(pickOne(r.contact)),
  }));

  const upvoted = (votesRes.data ?? [])
    .map((v) => pickOne(v.post))
    .filter((p): p is { id: string; title: string; category: string; created_at: string } => !!p);

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">My Activity</h1>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Introduction requests received
        </h2>
        <IntroInbox items={received} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Introduction requests sent
        </h2>
        {sent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            You haven&apos;t requested any introductions yet.{" "}
            <Link href="/directory" className="text-blue-600 hover:underline">
              Search the directory.
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <span className="text-slate-700">
                  Intro to <span className="font-medium">{r.contactName}</span>{" "}
                  via <span className="font-medium">{r.connectorName}</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[r.status]}`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your posts
        </h2>
        {myPosts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No posts yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {myPosts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/forum/${p.id}`}
                  className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:border-slate-400"
                >
                  <span className="font-medium text-slate-900">{p.title}</span>
                  <span className="ml-2 text-xs capitalize text-slate-500">
                    {p.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your comments
        </h2>
        {myComments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No comments yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {myComments.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/forum/${c.post_id}`}
                  className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:border-slate-400"
                >
                  <p className="text-slate-700">{c.body}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    on {c.postTitle}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Posts you upvoted
        </h2>
        {upvoted.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            You haven&apos;t upvoted anything yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upvoted.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/forum/${p.id}`}
                  className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:border-slate-400"
                >
                  <span className="font-medium text-slate-900">{p.title}</span>
                  <span className="ml-2 text-xs capitalize text-slate-500">
                    {p.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
