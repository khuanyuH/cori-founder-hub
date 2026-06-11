"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

// Edits the current user's own profile (RLS allows updating own row).
export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    company: profile.company ?? "",
    title: profile.title ?? "",
    bio: profile.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setSaved(false);
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        company: form.company.trim() || null,
        title: form.title.trim() || null,
        bio: form.bio.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSaved(true);
      router.refresh();
    }
  }

  const input =
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          First name
          <input className={input} value={form.first_name} onChange={set("first_name")} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Last name
          <input className={input} value={form.last_name} onChange={set("last_name")} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Company
          <input className={input} value={form.company} onChange={set("company")} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Title
          <input className={input} value={form.title} onChange={set("title")} />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">
        What you&apos;re working on / what you need
        <textarea
          className={input}
          rows={4}
          value={form.bio}
          onChange={set("bio")}
          placeholder="A short note so others know how to help you."
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
