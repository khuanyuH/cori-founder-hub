"use client";

import { useState } from "react";
import Image from "next/image";
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
        <Image
          src="/cori-logo.png"
          alt="CORI"
          width={40}
          height={40}
          priority
          className="h-10 w-10 object-contain"
        />
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
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            or use email
            <span className="h-px flex-1 bg-stone-200" />
          </div>

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
            <button type="submit" disabled={loading} className="btn-secondary w-full">
              {loading ? "Sending…" : "Email me a magic link ✨"}
            </button>
          </form>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
