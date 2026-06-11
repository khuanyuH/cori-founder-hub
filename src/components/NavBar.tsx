import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { displayName } from "@/lib/types";
import SignOutButton from "./SignOutButton";

// App-wide top nav. Renders different links depending on sign-in / approval
// state. Approved members get the full app; pending users get a minimal bar.
export default async function NavBar() {
  const session = await getCurrentProfile();

  const approved = session?.profile.status === "approved";
  const isAdmin = session?.profile.is_admin;

  const links = [
    { href: "/forum", label: "Forum" },
    { href: "/directory", label: "Directory" },
    { href: "/import", label: "Import" },
    { href: "/activity", label: "My Activity" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-black text-white shadow-sm">
            C
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            CORI <span className="text-brand">Network</span>
          </span>
        </Link>

        {approved && (
          <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-stone-600">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-2.5 py-1.5 transition hover:bg-stone-100 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/profile"
                className="hidden text-sm font-medium text-stone-500 transition hover:text-brand sm:inline"
              >
                {displayName(session.profile)}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-brand hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
