import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_EMOJI,
  CATEGORY_STYLES,
  POST_CATEGORIES,
  displayName,
  type PostCategory,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type PostListRow = {
  id: string;
  title: string;
  category: PostCategory;
  created_at: string;
  author_id: string;
  author: { first_name: string | null; last_name: string | null } | null;
  post_votes: { count: number }[];
  comments: { count: number }[];
};

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  await requireApproved();
  const sp = await searchParams;
  const sort = sp.sort === "top" ? "top" : "new";
  const category =
    sp.category && (POST_CATEGORIES as readonly string[]).includes(sp.category)
      ? (sp.category as PostCategory)
      : null;

  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(
      "id, title, category, created_at, author_id, author:profiles!author_id(first_name, last_name), post_votes(count), comments(count)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (category) query = query.eq("category", category);

  const { data } = await query;
  const rows = (data ?? []) as unknown as PostListRow[];

  const posts = rows
    .map((p) => ({
      ...p,
      votes: p.post_votes?.[0]?.count ?? 0,
      commentCount: p.comments?.[0]?.count ?? 0,
      author: Array.isArray(p.author) ? p.author[0] : p.author,
    }))
    .sort((a, b) =>
      sort === "top"
        ? b.votes - a.votes ||
          +new Date(b.created_at) - +new Date(a.created_at)
        : +new Date(b.created_at) - +new Date(a.created_at),
    );

  const buildHref = (next: { sort?: string; category?: string | null }) => {
    const params = new URLSearchParams();
    const s = next.sort ?? sort;
    const c = next.category === undefined ? category : next.category;
    if (s === "top") params.set("sort", "top");
    if (c) params.set("category", c);
    const qs = params.toString();
    return qs ? `/forum?${qs}` : "/forum";
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-ink">Forum</h1>
        <Link href="/forum/new" className="btn-primary">
          New post
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 text-sm font-medium">
          <Link
            href={buildHref({ sort: "new" })}
            className={`rounded-md px-3 py-1 ${sort === "new" ? "bg-brand text-white" : "text-stone-600"}`}
          >
            🆕 New
          </Link>
          <Link
            href={buildHref({ sort: "top" })}
            className={`rounded-md px-3 py-1 ${sort === "top" ? "bg-brand text-white" : "text-stone-600"}`}
          >
            🔥 Top
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-medium">
          <Link
            href={buildHref({ category: null })}
            className={`rounded-full px-3 py-1 ${!category ? "bg-brand text-white" : "border border-stone-300 text-stone-600"}`}
          >
            All
          </Link>
          {POST_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={buildHref({ category: c })}
              className={`rounded-full px-3 py-1 capitalize ${category === c ? "bg-brand text-white" : "border border-stone-300 text-stone-600"}`}
            >
              {CATEGORY_EMOJI[c]} {c}
            </Link>
          ))}
        </div>
      </div>

      <ul className="mt-6 space-y-2.5">
        {posts.length === 0 && (
          <li className="card p-8 text-center text-sm text-stone-500">
            No posts yet. Be the first to start a discussion. 🌱
          </li>
        )}
        {posts.map((p) => (
          <li key={p.id} className="card p-4 transition hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-brand-50 py-2 text-center">
                <span className="text-sm font-bold text-brand-dark">
                  {p.votes}
                </span>
                <span className="text-[10px] uppercase text-brand-dark/60">
                  votes
                </span>
              </div>
              <div className="min-w-0">
                <Link
                  href={`/forum/${p.id}`}
                  className="font-semibold text-ink hover:text-brand"
                >
                  {p.title}
                </Link>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium capitalize ${CATEGORY_STYLES[p.category]}`}
                  >
                    {CATEGORY_EMOJI[p.category]} {p.category}
                  </span>
                  <span>
                    <Link
                      href={`/members/${p.author_id}`}
                      className="hover:text-brand hover:underline"
                    >
                      {displayName(p.author)}
                    </Link>{" "}
                    · {p.commentCount} comment
                    {p.commentCount === 1 ? "" : "s"}
                  </span>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
