"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Upvote toggle for a post. Upvotes only — clicking again removes your vote.
export default function UpvoteButton({
  postId,
  userId,
  initialCount,
  initialVoted,
}: {
  postId: string;
  userId: string;
  initialCount: number;
  initialVoted: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();

    // Optimistic update.
    const nextVoted = !voted;
    setVoted(nextVoted);
    setCount((c) => c + (nextVoted ? 1 : -1));

    const { error } = nextVoted
      ? await supabase.from("post_votes").insert({ post_id: postId, user_id: userId })
      : await supabase
          .from("post_votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

    if (error) {
      // Roll back on failure.
      setVoted(!nextVoted);
      setCount((c) => c + (nextVoted ? -1 : 1));
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={voted}
      className={`flex h-fit w-12 shrink-0 flex-col items-center rounded-md border py-2 ${
        voted
          ? "border-brand bg-brand text-white"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400"
      }`}
    >
      <span className="text-lg leading-none">▲</span>
      <span className="mt-1 text-sm font-semibold">{count}</span>
    </button>
  );
}
