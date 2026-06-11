import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Returns the signed-in user and their profile, or null if not signed in.
// Creates the profile row on first sign-in (status 'pending').
export async function getCurrentProfile(): Promise<{
  userId: string;
  email: string | null;
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let profile = existing as Profile | null;

  if (!profile) {
    // First sign-in: create a pending profile.
    const { data: inserted, error } = await supabase
      .from("profiles")
      .insert({ id: user.id })
      .select("*")
      .single();
    if (error) {
      // Possible race (profile created concurrently) — re-fetch.
      const { data: refetched } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = refetched as Profile;
    } else {
      profile = inserted as Profile;
    }
  }

  return { userId: user.id, email: user.email ?? null, profile };
}

// Require a signed-in user. Redirects to /login otherwise.
export async function requireUser() {
  const result = await getCurrentProfile();
  if (!result) redirect("/login");
  return result;
}

// Require an approved member. Redirects pending users to /pending and
// signed-out users to /login.
export async function requireApproved() {
  const result = await getCurrentProfile();
  if (!result) redirect("/login");
  if (result.profile.status !== "approved") redirect("/pending");
  return result;
}

// Require an admin. Sends non-admins to the home page.
export async function requireAdmin() {
  const result = await requireApproved();
  if (!result.profile.is_admin) redirect("/");
  return result;
}
