"use client";

import { useState } from "react";
import { parseLinkedInCsv } from "@/lib/csv";

type ImportResult = {
  newContacts: number;
  newConnections: number;
  alreadyKnown: number;
};

export default function ImportClient() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<{ count: number; dropped: number } | null>(
    null,
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setPreview(null);
    setFileName(file.name);
    setParsing(true);

    try {
      const text = await file.text();
      const { contacts, dropped } = parseLinkedInCsv(text);

      if (contacts.length === 0) {
        setError(
          "No connections found. Make sure this is the Connections.csv exported from LinkedIn.",
        );
        setParsing(false);
        return;
      }

      setPreview({ count: contacts.length, dropped });
      setParsing(false);

      // Upload immediately after a successful parse.
      setUploading(true);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });
      const data = await res.json();
      setUploading(false);
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setResult(data as ImportResult);
    } catch {
      setParsing(false);
      setUploading(false);
      setError("Could not read the file.");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium text-slate-700">
          LinkedIn Connections.csv
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            disabled={parsing || uploading}
            className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
          />
        </label>
        {fileName && (
          <p className="mt-2 text-xs text-slate-500">Selected: {fileName}</p>
        )}
        {(parsing || uploading) && (
          <p className="mt-3 text-sm text-slate-600">
            {parsing ? "Reading file…" : "Uploading to the network…"}
          </p>
        )}
        {preview && !result && !error && (
          <p className="mt-3 text-sm text-slate-600">
            Found {preview.count} connections
            {preview.dropped > 0 && ` (skipped ${preview.dropped} without a name)`}
            .
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="font-medium text-green-900">Import complete</h2>
          <ul className="mt-3 space-y-1 text-sm text-green-800">
            <li>
              <span className="font-semibold">{result.newContacts}</span> new
              people added to the shared network
            </li>
            <li>
              <span className="font-semibold">{result.newConnections}</span> new
              connections recorded for you
            </li>
            <li>
              <span className="font-semibold">{result.alreadyKnown}</span> you
              were already connected to
            </li>
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h3 className="font-medium text-slate-900">
          How to export your connections
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            On LinkedIn, go to <em>Settings &amp; Privacy → Data Privacy → Get a
            copy of your data</em>.
          </li>
          <li>
            Select <em>Connections</em>, request the archive, and download the
            Connections.csv.
          </li>
          <li>Upload that file here.</li>
        </ol>
      </div>
    </div>
  );
}
