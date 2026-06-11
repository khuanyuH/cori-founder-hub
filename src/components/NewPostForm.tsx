"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { POST_CATEGORIES, type PostCategory } from "@/lib/types";

export default function NewPostForm({ authorId }: { authorId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: authorId,
        title: title.trim(),
        body: body.trim() || null,
        category,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/forum/${data.id}`);
    router.refresh();
  }

  const input =
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Title
        <input
          className={input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="What do you want to ask or share?"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Category
        <select
          className={input}
          value={category}
          onChange={(e) => setCategory(e.target.value as PostCategory)}
        >
          {POST_CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Body
        <textarea
          className={input}
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add details (optional)."
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
