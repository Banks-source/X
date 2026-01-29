"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/lib/ui/RequireAuth";
import { toErrorMessage } from "@/lib/errors";
import { AllocationBucket, validateBuckets } from "@/lib/models";
import { subscribeStrategy, updateStrategy } from "@/lib/strategies";

function newBucket(): AllocationBucket {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  return { id, name: "", percent: 0 };
}

export default function StrategyDetailPage() {
  return (
    <RequireAuth>
      <StrategyDetailInner />
    </RequireAuth>
  );
}

function StrategyDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buckets, setBuckets] = useState<AllocationBucket[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    return subscribeStrategy(
      id,
      (row) => {
        setLoading(false);
        setMissing(!row);
        if (!row) return;
        setName(row.name);
        setDescription(row.description ?? "");
        setBuckets(row.buckets ?? []);
      },
      (e) => {
        setLoading(false);
        setError(toErrorMessage(e));
      },
    );
  }, [id]);

  const validation = useMemo(() => validateBuckets(buckets), [buckets]);

  async function saveAll() {
    setError(null);
    setSaving(true);
    try {
      if (!name.trim()) throw new Error("Strategy name is required.");
      if (!validation.ok) throw new Error(validation.errors.join("\n"));

      await updateStrategy(id, {
        name: name.trim(),
        description,
        buckets,
      });
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 p-6">Loading…</div>;
  }

  if (missing) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-700">Strategy not found.</p>
          <Link className="mt-4 inline-block text-sm underline" href="/strategies">
            Back to strategies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/strategies" className="text-sm text-zinc-600 underline">
              ← Back
            </Link>
            <h1 className="mt-2 truncate text-2xl font-semibold">Edit strategy</h1>
          </div>

          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={saveAll}
            disabled={saving || !name.trim() || !validation.ok}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </header>

        {error ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </pre>
        ) : null}

        {!validation.ok ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-medium">Validation</div>
            <ul className="mt-2 list-disc pl-5">
              {validation.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Buckets total: {validation.sum}
          </div>
        )}

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Details</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Allocation buckets</h2>
            <button
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              onClick={() => setBuckets((b) => [...b, newBucket()])}
              type="button"
            >
              + Add bucket
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-zinc-600">
                <tr>
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2 w-40">Percent</th>
                  <th className="py-2 pr-2 w-24"></th>
                </tr>
              </thead>
              <tbody className="align-top">
                {buckets.map((b, idx) => (
                  <tr key={b.id} className="border-t border-zinc-100">
                    <td className="py-2 pr-2">
                      <input
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2"
                        value={b.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setBuckets((prev) =>
                            prev.map((x) => (x.id === b.id ? { ...x, name: v } : x)),
                          );
                        }}
                        placeholder={`Bucket ${idx + 1}`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2"
                        value={String(b.percent)}
                        inputMode="decimal"
                        onChange={(e) => {
                          const num = Number(e.target.value);
                          setBuckets((prev) =>
                            prev.map((x) =>
                              x.id === b.id
                                ? { ...x, percent: Number.isFinite(num) ? num : 0 }
                                : x,
                            ),
                          );
                        }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <button
                        className="rounded-lg bg-zinc-100 px-3 py-2"
                        onClick={() =>
                          setBuckets((prev) => prev.filter((x) => x.id !== b.id))
                        }
                        type="button"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            Requirement: bucket percents must sum to 100.
          </div>
        </section>
      </div>
    </div>
  );
}
