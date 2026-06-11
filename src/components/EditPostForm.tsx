"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { POST_CATEGORIES, type Post, type PostCategory } from "@/lib/types";

export default function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body ?? "");
  const [category, setCategory] = useState<PostCategory>(post.category);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        body: body.trim() || null,
        category,
      })
      .eq("id", post.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/forum/${post.id}`);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this post and its comments? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }
    router.push("/forum");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <label className="block text-sm font-medium text-stone-700">
        Title
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm font-medium text-stone-700">
        Category
        <select
          className="field"
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
      <label className="block text-sm font-medium text-stone-700">
        Body
        <textarea
          className="field"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <span className="mt-1 block text-xs font-normal text-stone-400">
          Markdown supported — **bold**, _italic_, lists, [links](url).
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete post"}
        </button>
      </div>
    </form>
  );
}
