import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { displayName } from "@/lib/types";

export default async function HomePage() {
  const { profile } = await requireApproved();

  const tiles = [
    {
      href: "/forum",
      emoji: "💬",
      title: "Forum",
      desc: "Ask questions, swap playbooks, and share what you're learning.",
      accent: "hover:border-violet-300",
    },
    {
      href: "/directory",
      emoji: "🤝",
      title: "Warm-intro directory",
      desc: "Search the pooled network and get introduced through someone who knows them.",
      accent: "hover:border-brand",
    },
    {
      href: "/import",
      emoji: "📇",
      title: "Import connections",
      desc: "Add your LinkedIn connections to grow the shared network.",
      accent: "hover:border-emerald-300",
    },
    {
      href: "/activity",
      emoji: "⚡",
      title: "My Activity",
      desc: "Your posts, comments, and introduction requests in one place.",
      accent: "hover:border-sky-300",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-stone-200/70 bg-gradient-to-br from-brand to-brand-dark px-7 py-9 text-white shadow-sm">
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          Center on Rural Innovation
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Welcome back, {displayName(profile).split(" ")[0]} 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/90">
          The founder network for CORI — discussion, warm intros, and the people
          who can help you get unstuck. Built by founders, for founders.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/directory"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm transition hover:bg-stone-100"
          >
            Find a warm intro →
          </Link>
          <Link
            href="/forum/new"
            className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Start a discussion
          </Link>
        </div>
      </section>

      {/* Tiles */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`card group flex items-start gap-4 p-5 transition hover:shadow-md ${t.accent}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl transition group-hover:scale-110">
              {t.emoji}
            </span>
            <div>
              <h2 className="font-bold text-ink">{t.title}</h2>
              <p className="mt-1 text-sm text-stone-600">{t.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
