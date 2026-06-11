import Papa from "papaparse";

// A cleaned contact row ready to be sent to the import endpoint.
export type CleanContact = {
  first_name: string;
  last_name: string;
  company: string | null;
  position: string | null;
  linkedin_url: string | null;
  dedup_key: string;
};

// Normalize a LinkedIn (or any) URL for deduplication:
// lowercase, strip protocol, leading "www.", query/fragment, and trailing slash.
export function normalizeUrl(url: string): string {
  let u = url.trim().toLowerCase();
  u = u.replace(/^https?:\/\//, "");
  u = u.replace(/^www\./, "");
  u = u.split("#")[0];
  u = u.split("?")[0];
  u = u.replace(/\/+$/, "");
  return u;
}

// Build the dedup_key for a contact. Prefer the normalized URL; otherwise fall
// back to "first|last|company" (all lowercased/trimmed). This global key is what
// lets one contact have many member edges (many possible introducers).
export function computeDedupKey(
  firstName: string,
  lastName: string,
  company: string,
  url: string,
): string {
  if (url.trim()) return normalizeUrl(url);
  return [firstName, lastName, company]
    .map((s) => s.trim().toLowerCase())
    .join("|");
}

// Pick a value from a parsed row by header name, case-insensitively.
function field(row: Record<string, string>, name: string): string {
  const key = Object.keys(row).find(
    (k) => k.trim().toLowerCase() === name.toLowerCase(),
  );
  return key ? (row[key] ?? "").trim() : "";
}

export type ParseResult = {
  contacts: CleanContact[];
  totalRows: number; // data rows seen (before dropping nameless ones)
  dropped: number; // rows dropped for missing first+last name
};

// Parse a LinkedIn Connections.csv. The file does NOT have headers on row 1: it
// begins with several preamble/notes lines, then the real header row. We locate
// the header row (first line containing "First Name") and parse from there.
export function parseLinkedInCsv(text: string): ParseResult {
  const lines = text.split(/\r\n|\n|\r/);
  const headerIdx = lines.findIndex((line) => /first name/i.test(line));

  if (headerIdx === -1) {
    return { contacts: [], totalRows: 0, dropped: 0 };
  }

  const fromHeader = lines.slice(headerIdx).join("\n");
  const parsed = Papa.parse<Record<string, string>>(fromHeader, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data;
  let dropped = 0;
  const seen = new Set<string>();
  const contacts: CleanContact[] = [];

  for (const row of rows) {
    const firstName = field(row, "First Name");
    const lastName = field(row, "Last Name");

    // Drop rows with no first+last name.
    if (!firstName && !lastName) {
      dropped++;
      continue;
    }
    if (!firstName || !lastName) {
      dropped++;
      continue;
    }

    const company = field(row, "Company");
    const position = field(row, "Position");
    // LinkedIn's URL column header is "URL". Email Address and Connected On
    // columns are intentionally ignored.
    const url = field(row, "URL");

    const dedupKey = computeDedupKey(firstName, lastName, company, url);

    // De-dupe within this single file so we don't send redundant rows.
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    contacts.push({
      first_name: firstName,
      last_name: lastName,
      company: company || null,
      position: position || null,
      linkedin_url: url || null,
      dedup_key: dedupKey,
    });
  }

  return { contacts, totalRows: rows.length, dropped };
}
