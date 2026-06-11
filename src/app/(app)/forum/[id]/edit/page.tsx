import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import EditPostForm from "@/components/EditPostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireApproved();
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();
  // Only the author may edit. (RLS also enforces this on write.)
  if (post.author_id !== userId) redirect(`/forum/${id}`);

  return (
    <div className="max-w-2xl">
      <Link href={`/forum/${id}`} className="text-sm text-stone-500 hover:text-ink">
        ← Back to post
      </Link>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-ink">
        Edit post
      </h1>
      <div className="mt-6">
        <EditPostForm post={post as Post} />
      </div>
    </div>
  );
}
