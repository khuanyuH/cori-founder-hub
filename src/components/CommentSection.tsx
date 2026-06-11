"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type FlatComment = {
  id: string;
  body: string;
  parent_comment_id: string | null;
  author_id: string;
  created_at: string;
  authorName: string;
};

type TreeComment = FlatComment & { children: TreeComment[] };

function buildTree(flat: FlatComment[]): TreeComment[] {
  const byId = new Map<string, TreeComment>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: TreeComment[] = [];
  byId.forEach((node) => {
    if (node.parent_comment_id && byId.has(node.parent_comment_id)) {
      byId.get(node.parent_comment_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function CommentSection({
  postId,
  userId,
  initial,
}: {
  postId: string;
  userId: string;
  initial: FlatComment[];
}) {
  const tree = useMemo(() => buildTree(initial), [initial]);

  return (
    <div className="mt-3">
      <CommentForm postId={postId} userId={userId} parentId={null} />
      <ul className="mt-6 space-y-4">
        {tree.length === 0 && (
          <li className="text-sm text-slate-500">No comments yet.</li>
        )}
        {tree.map((c) => (
          <CommentNode key={c.id} node={c} postId={postId} userId={userId} />
        ))}
      </ul>
    </div>
  );
}

function CommentNode({
  node,
  postId,
  userId,
}: {
  node: TreeComment;
  postId: string;
  userId: string;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <li>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs font-medium text-slate-700">{node.authorName}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
          {node.body}
        </p>
        <button
          onClick={() => setReplying((r) => !r)}
          className="mt-2 text-xs text-slate-500 hover:text-slate-900"
        >
          {replying ? "Cancel" : "Reply"}
        </button>
        {replying && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              userId={userId}
              parentId={node.id}
              onDone={() => setReplying(false)}
              compact
            />
          </div>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="mt-3 space-y-3 border-l border-slate-200 pl-4">
          {node.children.map((child) => (
            <CommentNode
              key={child.id}
              node={child}
              postId={postId}
              userId={userId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function CommentForm({
  postId,
  userId,
  parentId,
  onDone,
  compact,
}: {
  postId: string;
  userId: string;
  parentId: string | null;
  onDone?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      parent_comment_id: parentId,
      body: body.trim(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder={parentId ? "Write a reply…" : "Add a comment…"}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Posting…" : parentId ? "Reply" : "Comment"}
      </button>
    </form>
  );
}
