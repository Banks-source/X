"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toErrorMessage } from "@/lib/errors";
import { parseKuberaCsv } from "@/lib/kuberaCsv";
import { createHolding, createImportRun, upsertAsset } from "@/lib/portfolio";
import { RequireAuth } from "@/lib/ui/RequireAuth";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ImportPage() {
  return (
    <RequireAuth>
      <ImportInner />
    </RequireAuth>
  );
}

function ImportInner() {
  const params = useParams<{ id: string }>();
  const strategyId = params.id;

  const [asOf, setAsOf] = useState(todayISO());
  const [raw, setRaw] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const rows = useMemo(() => {
    if (!raw.trim()) return [];
    try {
      return parseKuberaCsv(raw, asOf);
    } catch {
      return [];
    }
  }, [raw, asOf]);

  async function onFile(file: File) {
    setError(null);
    const text = await file.text();
    setRaw(text);
  }

  async function onImport() {
    setError(null);
    setImporting(true);
    try {
      if (rows.length === 0) throw new Error("No rows parsed. Check CSV format.");

      await createImportRun(strategyId, {
        source: "kubera",
        rowCount: rows.length,
        notes: `asOf=${asOf}`,
      });

      // MVP: create assets keyed by name+category in-memory for this import.
      const assetIdByKey = new Map<string, string>();

      for (const r of rows) {
        const key = `${r.category}::${r.name}`;
        let assetId = assetIdByKey.get(key);
        if (!assetId) {
          assetId = await upsertAsset(strategyId, {
            name: r.name,
            category: r.category,
            notes: "",
          });
          assetIdByKey.set(key, assetId);
        }

        await createHolding(strategyId, {
          assetId,
          asOf: r.asOf,
          value: r.value,
          source: "kubera",
        });
      }

      setRaw("");
      alert("Import complete.");
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl">
        <Link href={`/strategies/${strategyId}`} className="text-sm text-zinc-600 underline">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Import (Kubera CSV)</h1>

        <p className="mt-2 text-sm text-zinc-600">
          Expected CSV headers: <code>name,category,value</code> (optional: <code>asOf</code>). Category
          one of: property/cash/brokerage/crypto/other.
        </p>

        {error ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </pre>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Upload CSV</div>
            <input
              className="mt-3 block w-full text-sm"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium">Default asOf</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
              <div className="mt-1 text-xs text-zinc-500">Used if CSV has no asOf column.</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Preview</div>
              <div className="text-xs text-zinc-500">{rows.length} rows</div>
            </div>
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-zinc-100">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-zinc-600">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">asOf</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-zinc-100">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.category}</td>
                      <td className="p-2">{r.value}</td>
                      <td className="p-2">{r.asOf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={onImport}
              disabled={importing || rows.length === 0}
              type="button"
            >
              {importing ? "Importing…" : "Import"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Raw CSV</div>
          <textarea
            className="mt-3 w-full rounded-lg border border-zinc-200 p-3 text-sm"
            rows={10}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste CSV here (optional)"
          />
        </div>
      </div>
    </div>
  );
}
