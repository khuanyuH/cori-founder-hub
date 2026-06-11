# CORI Network

A closed, internal founder network for the **Center on Rural Innovation (CORI)** —
for founders, mentors, and staff across CORI's incubators. Three features:

1. **Forum** — a Reddit-style discussion board (posts, threaded comments, upvotes).
2. **Warm-intro directory** — members upload their LinkedIn connections into a
   pooled network. Anyone can search the pool for a person they want to meet and
   ask the member who knows them for an introduction. **Raw contact details are
   never exposed** — the introduction is the only path.
3. **Auth + "My Activity"** — passwordless sign-in and a personal activity view.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**, deploy to Vercel.
- **Supabase** for Postgres, Auth, and Row-Level Security
  (`@supabase/supabase-js`, `@supabase/ssr`).
- **papaparse** for CSV parsing.
- No other backend — all server logic lives in Next.js Route Handlers.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name,
   a strong database password, and a region near your users.
2. Once it's provisioned, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — keep secret)

## 2. Run the database migrations

Open **SQL Editor → New query** in the Supabase dashboard and run these files
**in order**, from `supabase/migrations/`:

1. `0001_schema.sql` — tables, full-text search index, triggers.
2. `0002_rls_grants.sql` — Row-Level Security policies, helper functions, and
   the **GRANTs** that new Supabase projects require for the auto-generated API
   to reach the tables.

> ⚠️ Projects created after 2026-05-30 need explicit GRANTs (in `0002`) in
> addition to RLS, or API queries return empty/forbidden. The migration handles
> this.

You'll run `0003_seed_admin.sql` later (see step 5).

## 3. Configure Auth providers

In the Supabase dashboard → **Authentication**:

- **Email** is on by default — this powers the magic-link sign-in.
- **URL Configuration**: set **Site URL** to your app URL
  (`http://localhost:3000` for local dev) and add
  `http://localhost:3000/auth/callback` (and your Vercel URL's `/auth/callback`)
  to **Redirect URLs**.
- **(Optional) Google OAuth**: under **Authentication → Providers → Google**,
  enable it and paste a Google OAuth client ID/secret. Set the authorized
  redirect URI in Google Cloud to
  `https://<your-project-ref>.supabase.co/auth/v1/callback`. Magic link is the
  default; Google is a secondary option on the login screen.

## 4. Set environment variables

Copy `.env.example` to `.env.local` and fill in the values from step 1:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never NEXT_PUBLIC
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The `SUPABASE_SERVICE_ROLE_KEY` is used **only** by the CSV import endpoint
(`src/app/api/import/route.ts`) to perform bulk upserts that bypass RLS. It is
never exposed to the browser.

## 5. Seed the first admin (manual step)

1. Start the app and sign in once with the email you want to be the admin —
   this creates your `auth.users` row and a **pending** profile.
2. In the Supabase **SQL Editor**, open `supabase/migrations/0003_seed_admin.sql`,
   replace `CHANGE_ME@example.com` with your email, and run it. This sets your
   profile to `approved` + `is_admin = true`.
3. Reload the app — you'll now see the **Admin** tab and can approve other members.

## 6. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How the pieces work

### Access model
- First sign-in auto-creates a `profiles` row with status `pending`.
- Pending users can sign in but only see/edit their own profile and an
  "awaiting approval" screen — no directory, no forum.
- An admin approves members (status → `approved`). Everything else is gated on
  `status = 'approved'` via RLS.

### LinkedIn CSV import
LinkedIn's `Connections.csv` has **preamble lines before the real header row**.
The parser (`src/lib/csv.ts`) finds the first line containing "First Name",
parses from there, maps `First Name / Last Name / URL / Company / Position`
(ignoring `Email Address` and `Connected On`), drops nameless rows, and computes
a `dedup_key`:

- If a URL is present → normalized URL (lowercased, no protocol/`www.`/query/
  fragment/trailing slash).
- Otherwise → `first|last|company` (lowercased, trimmed).

The import endpoint bulk-upserts `contacts` `ON CONFLICT (dedup_key) DO NOTHING`,
resolves ids, then bulk-inserts `connections` (your edges)
`ON CONFLICT (member_id, contact_id) DO NOTHING`, and returns
`{ newContacts, newConnections, alreadyKnown }`. This **global dedup** is what
powers warm intros: one contact, many edges = many possible introducers. We
**never store email or phone**.

### Directory search
Postgres full-text search over a generated `tsvector` (`first_name`,
`last_name`, `company`, `position`) with a GIN index, queried via
`websearch_to_tsquery`. Each result shows the contact plus **"Known by"** the
members who can introduce you. (pgvector embeddings can be layered on later.)

---

## Deploy to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. Add the four environment variables from `.env.local` in the Vercel project
   settings (set `NEXT_PUBLIC_SITE_URL` to your production URL).
3. Add your production `…/auth/callback` URL to Supabase **Redirect URLs**.

## Keep a free-tier project warm

Free Supabase projects pause after ~7 days of inactivity. There's a tiny
health-check endpoint at **`/api/health`** that touches the database. Ping it on
a schedule (e.g. a GitHub Action running every few days) to keep the project
awake; otherwise restore it from the Supabase dashboard.

Example GitHub Action (`.github/workflows/keepalive.yml`):

```yaml
name: keepalive
on:
  schedule:
    - cron: "0 12 */3 * *" # every 3 days
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS https://YOUR-APP.vercel.app/api/health
```
