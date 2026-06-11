import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/types";
import UpvoteButton from "@/components/UpvoteButton";
import CommentSection, { type FlatComment } from "@/components/CommentSection";

export const dynamic = "force-dynamic";

function oneAuthor(
  a: { first_name: string | null; last_name: string | null }[] | { first_name: string | null; last_name: string | null } | null,
) {
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireApproved();
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, author:profiles!author_id(first_name, last_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  const { data: votes } = await supabase
    .from("post_votes")
    .select("user_id")
    .eq("post_id", id);
  const voteCount = votes?.length ?? 0;
  const hasVoted = (votes ?? []).some((v) => v.user_id === userId);

  const { data: commentRows } = await supabase
    .from("comments")
    .select(
      "id, body, parent_comment_id, author_id, created_at, author:profiles!author_id(first_name, last_name)",
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const comments: FlatComment[] = (commentRows ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    parent_comment_id: c.parent_comment_id,
    author_id: c.author_id,
    created_at: c.created_at,
    authorName: displayName(oneAuthor(c.author)),
  }));

  const author = oneAuthor(post.author);

  return (
    <div className="max-w-2xl">
      <Link href="/forum" className="text-sm text-slate-500 hover:text-slate-900">
        ← Back to forum
      </Link>

      <article className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex gap-4">
          <UpvoteButton
            postId={id}
            userId={userId}
            initialCount={voteCount}
            initialVoted={hasVoted}
          />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">
              {post.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              <span className="capitalize">{post.category}</span> ·{" "}
              {displayName(author)}
            </p>
            {post.body && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
                {post.body}
              </p>
            )}
          </div>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Comments
        </h2>
        <CommentSection postId={id} userId={userId} initial={comments} />
      </section>
    </div>
  );
}
