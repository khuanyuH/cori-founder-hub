// Shared row types mirroring the Postgres schema (supabase/migrations).

export type ProfileStatus = "pending" | "approved";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  bio: string | null;
  website: string | null;
  linkedin_url: string | null;
  location: string | null;
  industry: string | null;
  stage: string | null;
  looking_for: string | null;
  status: ProfileStatus;
  is_admin: boolean;
  created_at: string;
};

// Founder stage options for the profile form / directory filter.
export const FOUNDER_STAGES = [
  "Idea",
  "Pre-seed",
  "Seed",
  "Series A",
  "Growth",
  "Bootstrapped",
  "Not raising",
] as const;

export type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  linkedin_url: string | null;
  dedup_key: string;
  created_at: string;
};

export type IntroStatus = "pending" | "accepted" | "declined" | "completed";

export type IntroRequest = {
  id: string;
  requester_id: string;
  connector_id: string;
  contact_id: string;
  message: string | null;
  status: IntroStatus;
  created_at: string;
  updated_at: string;
};

export const POST_CATEGORIES = [
  "fundraising",
  "hiring",
  "product",
  "legal",
  "general",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

// Colorful badge styles per forum category (Tailwind classes).
export const CATEGORY_STYLES: Record<PostCategory, string> = {
  fundraising: "bg-emerald-100 text-emerald-800",
  hiring: "bg-sky-100 text-sky-800",
  product: "bg-violet-100 text-violet-800",
  legal: "bg-amber-100 text-amber-800",
  general: "bg-stone-100 text-stone-700",
};

export const CATEGORY_EMOJI: Record<PostCategory, string> = {
  fundraising: "💰",
  hiring: "🧑‍💻",
  product: "🚀",
  legal: "⚖️",
  general: "💬",
};

export type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  category: PostCategory;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
};

// PostgREST may return a to-one embed as an object or a single-element array.
// Normalize to one item (or null).
export function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

// Display helper.
export function displayName(
  p: Pick<Profile, "first_name" | "last_name"> | null | undefined,
): string {
  if (!p) return "Unknown member";
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return name || "Unnamed member";
}

// Two-letter initials from a first/last name pair, for avatar chips.
export function initials(
  p: { first_name: string | null; last_name: string | null } | null | undefined,
): string {
  if (!p) return "?";
  const a = (p.first_name ?? "").trim()[0] ?? "";
  const b = (p.last_name ?? "").trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function contactName(
  c: Pick<Contact, "first_name" | "last_name"> | null | undefined,
): string {
  if (!c) return "Unknown contact";
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || "Unnamed contact";
}
