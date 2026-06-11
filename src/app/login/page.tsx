"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo =
    (typeof window !== "undefined" ? window.location.origin : "") +
    "/auth/callback";

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-lg font-black text-white shadow-sm">
          C
        </span>
        <span className="text-xl font-bold tracking-tight text-ink">
          CORI <span className="text-brand">Network</span>
        </span>
      </div>
      <h1 className="mt-6 text-2xl font-black tracking-tight text-ink">
        The founder network for the Center on Rural Innovation.
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Discussion, warm intros, and the people who can help you build. Members
        only — sign in to continue.
      </p>

      {sent ? (
        <div className="card mt-8 p-6 text-sm">
          <p className="text-2xl">📬</p>
          <p className="mt-2 font-semibold text-ink">Check your email</p>
          <p className="mt-1 text-stone-600">
            We sent a magic sign-in link to{" "}
            <span className="font-medium">{email}</span>. Open it on this device
            to continue.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <form onSubmit={sendMagicLink} className="space-y-3">
            <label className="block text-sm font-medium text-stone-700">
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="field"
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Email me a magic link ✨"}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            or
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <button onClick={signInWithGoogle} className="btn-secondary w-full">
            Continue with Google
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
