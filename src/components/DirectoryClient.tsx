"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { contactName, displayName, initials } from "@/lib/types";

type Connector = { id: string; first_name: string | null; last_name: string | null };

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  linkedin_url: string | null;
};

type ContactWithConnectors = Contact & { knownBy: Connector[] };

type IntroTarget = {
  contactId: string;
  contactLabel: string;
  connectorId: string;
  connectorLabel: string;
};

const PAGE_SIZE = 24;

// Fetch the "Known by" members for a batch of contacts and attach them.
async function attachKnownBy(
  supabase: ReturnType<typeof createClient>,
  contacts: Contact[],
): Promise<ContactWithConnectors[]> {
  const ids = contacts.map((c) => c.id);
  const knownByMap = new Map<string, Connector[]>();

  if (ids.length > 0) {
    const { data: edges } = await supabase
      .from("connections")
      .select("contact_id, member:profiles!member_id(id, first_name, last_name)")
      .in("contact_id", ids);

    for (const e of edges ?? []) {
      const raw = (e as { member: Connector | Connector[] | null }).member;
      const m = Array.isArray(raw) ? raw[0] : raw;
      if (!m) continue;
      const list = knownByMap.get(e.contact_id) ?? [];
      list.push(m);
      knownByMap.set(e.contact_id, list);
    }
  }

  return contacts.map((c) => ({ ...c, knownBy: knownByMap.get(c.id) ?? [] }));
}

export default function DirectoryClient({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  // The query that produced the currently shown results (null = browsing all).
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactWithConnectors[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"semantic" | "text" | null>(null);
  const [intro, setIntro] = useState<IntroTarget | null>(null);

  // Browse all contacts alphabetically, paginated. `append` loads the next page.
  const loadBrowse = useCallback(async (append: boolean) => {
    const supabase = createClient();
    const from = append ? contactsRef.current.length : 0;
    const { data, error } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, company, position, linkedin_url")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      setError(error.message);
      return;
    }
    const withConnectors = await attachKnownBy(supabase, data ?? []);
    setHasMore((data ?? []).length === PAGE_SIZE);
    setContacts((prev) => (append ? [...prev, ...withConnectors] : withConnectors));
  }, []);

  // Keep a ref to the current contacts so loadBrowse can read the length for
  // pagination without being re-created on every change.
  const contactsRef = useRef<ContactWithConnectors[]>([]);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Initial browse load.
  useEffect(() => {
    setLoading(true);
    loadBrowse(false).finally(() => setLoading(false));
  }, [loadBrowse]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setError(null);
    setHasMore(false);

    // Empty query returns to the full browse view.
    if (!q) {
      setActiveQuery(null);
      setLoading(true);
      await loadBrowse(false);
      setHasMore(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setActiveQuery(q);

    // Semantic search (with full-text fallback) runs server-side so the query
    // can be embedded with the server-only Voyage key.
    const res = await fetch(`/api/directory-search?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Search failed.");
      setLoading(false);
      return;
    }
    setSearchMode(json.mode === "semantic" ? "semantic" : "text");

    const supabase = createClient();
    const withConnectors = await attachKnownBy(supabase, json.contacts ?? []);
    setContacts(withConnectors);
    setLoading(false);
  }

  async function clearSearch() {
    setQuery("");
    setActiveQuery(null);
    setSearchMode(null);
    setError(null);
    setLoading(true);
    await loadBrowse(false);
    setHasMore(true);
    setLoading(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    await loadBrowse(true);
    setLoadingMore(false);
  }

  return (
    <div className="mt-6">
      <form onSubmit={runSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company, or what you need (e.g. fintech investor)…"
          className="field flex-1"
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "…" : "Search"}
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
        <span className="flex items-center gap-2">
          {activeQuery
            ? `${contacts.length} result${contacts.length === 1 ? "" : "s"} for “${activeQuery}”`
            : "Browsing the network"}
          {activeQuery && searchMode === "semantic" && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-dark">
              ✨ Smart search
            </span>
          )}
        </span>
        {activeQuery && (
          <button onClick={clearSearch} className="text-stone-500 hover:text-ink">
            Clear search
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Loading…</p>
      ) : contacts.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          {activeQuery
            ? "No matches. Try a different name, company, or title."
            : "No contacts in the network yet. Import your LinkedIn connections to get started."}
        </p>
      ) : (
        <>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                currentUserId={currentUserId}
                onRequestIntro={setIntro}
              />
            ))}
          </ul>

          {!activeQuery && hasMore && (
            <div className="mt-6 flex justify-center">
              <button onClick={loadMore} disabled={loadingMore} className="btn-secondary">
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {intro && (
        <IntroModal
          currentUserId={currentUserId}
          intro={intro}
          onClose={() => setIntro(null)}
        />
      )}
    </div>
  );
}

function ContactCard({
  contact: c,
  currentUserId,
  onRequestIntro,
}: {
  contact: ContactWithConnectors;
  currentUserId: string;
  onRequestIntro: (t: IntroTarget) => void;
}) {
  const others = c.knownBy.filter((m) => m.id !== currentUserId);
  const youKnow = c.knownBy.some((m) => m.id === currentUserId);

  return (
    <li className="card flex flex-col p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-dark">
          {initials(c)}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{contactName(c)}</p>
          <p className="truncate text-sm text-stone-600">
            {[c.position, c.company].filter(Boolean).join(" · ") || "—"}
          </p>
          {c.linkedin_url && (
            <a
              href={c.linkedin_url.startsWith("http") ? c.linkedin_url : `https://${c.linkedin_url}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
            >
              LinkedIn profile ↗
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-stone-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Known by
        </p>
        {c.knownBy.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">No members yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {youKnow && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                You know this person
              </span>
            )}
            {others.map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  onRequestIntro({
                    contactId: c.id,
                    contactLabel: contactName(c),
                    connectorId: m.id,
                    connectorLabel: displayName(m),
                  })
                }
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Ask {displayName(m)} for an intro
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function IntroModal({
  currentUserId,
  intro,
  onClose,
}: {
  currentUserId: string;
  intro: IntroTarget;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("intro_requests").insert({
      requester_id: currentUserId,
      connector_id: intro.connectorId,
      contact_id: intro.contactId,
      message: message.trim() || null,
    });
    setSending(false);
    if (error) setError(error.message);
    else setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {done ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900">
              Request sent
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {intro.connectorLabel} will see your request and can make the
              introduction to {intro.contactLabel}.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Done
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 className="text-lg font-semibold text-slate-900">
              Request an introduction
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ask <span className="font-medium">{intro.connectorLabel}</span> to
              introduce you to{" "}
              <span className="font-medium">{intro.contactLabel}</span>.
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Why would you like to meet?
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="A short note your connector can forward."
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
