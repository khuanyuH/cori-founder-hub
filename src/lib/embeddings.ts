import "server-only";
import type { Contact } from "@/lib/types";

// Voyage AI embeddings. voyage-3.5-lite at 1024 dims matches the pgvector
// column in migration 0005. Server-only — uses VOYAGE_API_KEY.
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3.5-lite";
export const EMBED_DIM = 1024;
// Voyage accepts up to 1000 inputs per request; stay well under to bound size.
export const EMBED_BATCH = 128;

export function embeddingsEnabled(): boolean {
  return !!process.env.VOYAGE_API_KEY;
}

// The text we embed for a contact: who they are, what they do, where.
export function contactEmbedText(
  c: Pick<Contact, "first_name" | "last_name" | "company" | "position">,
): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const role = [c.position, c.company].filter(Boolean).join(" at ");
  return [name, role].filter(Boolean).join(" — ") || name || "unknown";
}

async function callVoyage(
  inputs: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: inputs,
      model: MODEL,
      input_type: inputType,
      output_dimension: EMBED_DIM,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Voyage embeddings failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  // Sort by index to guarantee alignment with the input order.
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// Embed a batch of documents (≤ EMBED_BATCH items).
export function embedDocuments(texts: string[]): Promise<number[][]> {
  return callVoyage(texts, "document");
}

// Embed a single search query.
export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await callVoyage([text], "query");
  return embedding;
}
