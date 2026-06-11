"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FOUNDER_STAGES, type Profile } from "@/lib/types";

// Edits the current user's own profile (RLS allows updating own row).
export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    company: profile.company ?? "",
    title: profile.title ?? "",
    location: profile.location ?? "",
    industry: profile.industry ?? "",
    stage: profile.stage ?? "",
    website: profile.website ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    bio: profile.bio ?? "",
    looking_for: profile.looking_for ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setSaved(false);
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const clean = (s: string) => s.trim() || null;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: clean(form.first_name),
        last_name: clean(form.last_name),
        company: clean(form.company),
        title: clean(form.title),
        location: clean(form.location),
        industry: clean(form.industry),
        stage: clean(form.stage),
        website: clean(form.website),
        linkedin_url: clean(form.linkedin_url),
        bio: clean(form.bio),
        looking_for: clean(form.looking_for),
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-stone-700">
          First name
          <input className="field" value={form.first_name} onChange={set("first_name")} />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Last name
          <input className="field" value={form.last_name} onChange={set("last_name")} />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Company
          <input className="field" value={form.company} onChange={set("company")} />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Title
          <input className="field" value={form.title} onChange={set("title")} />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Location
          <input
            className="field"
            value={form.location}
            onChange={set("location")}
            placeholder="City, State"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Industry
          <input
            className="field"
            value={form.industry}
            onChange={set("industry")}
            placeholder="e.g. AgTech, Healthcare"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Stage
          <select className="field" value={form.stage} onChange={set("stage")}>
            <option value="">—</option>
            {FOUNDER_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Website
          <input
            className="field"
            value={form.website}
            onChange={set("website")}
            placeholder="https://"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700 sm:col-span-2">
          LinkedIn URL
          <input
            className="field"
            value={form.linkedin_url}
            onChange={set("linkedin_url")}
            placeholder="https://linkedin.com/in/…"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-stone-700">
        What you&apos;re working on
        <textarea
          className="field"
          rows={4}
          value={form.bio}
          onChange={set("bio")}
          placeholder="A short note so others know what you're building."
        />
      </label>

      <label className="block text-sm font-medium text-stone-700">
        What you need help with right now
        <textarea
          className="field"
          rows={2}
          value={form.looking_for}
          onChange={set("looking_for")}
          placeholder="e.g. intros to AgTech investors, a technical co-founder, design feedback…"
        />
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sm text-brand">Saved ✓</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
