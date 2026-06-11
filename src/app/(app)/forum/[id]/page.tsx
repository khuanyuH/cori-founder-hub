import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/types";
import UpvoteButton from "@/components/UpvoteButton";
import CommentSection, { type FlatComment } from "@/components/CommentSection";
import Markdown from "@/components/Markdown";

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
      "id, title, body, category, created_at, author_id, author:profiles!author_id(first_name, last_name)",
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

  const isAuthor = post.author_id === userId;

  return (
    <div className="max-w-2xl">
      <Link href="/forum" className="text-sm text-stone-500 hover:text-ink">
        ← Back to forum
      </Link>

      <article className="card mt-4 p-6">
        <div className="flex gap-4">
          <UpvoteButton
            postId={id}
            userId={userId}
            initialCount={voteCount}
            initialVoted={hasVoted}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-ink">{post.title}</h1>
              {isAuthor && (
                <Link
                  href={`/forum/${id}/edit`}
                  className="shrink-0 text-sm font-medium text-stone-500 hover:text-brand"
                >
                  Edit
                </Link>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              <span className="capitalize">{post.category}</span> ·{" "}
              <Link
                href={`/members/${post.author_id}`}
                className="hover:text-brand hover:underline"
              >
                {displayName(author)}
              </Link>
            </p>
            {post.body && (
              <div className="mt-4">
                <Markdown>{post.body}</Markdown>
              </div>
            )}
          </div>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Comments
        </h2>
        <CommentSection postId={id} userId={userId} initial={comments} />
      </section>
    </div>
  );
}
