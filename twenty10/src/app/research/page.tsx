"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuthAdapter } from "@/lib/auth/auth";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { toErrorMessage } from "@/lib/errors";
import { ResearchItem, Strategy } from "@/lib/models";
import {
  createResearchItem,
  deleteResearchItem,
  subscribeResearchItems,
} from "@/lib/research";
import { subscribeStrategies } from "@/lib/strategies";
import { RequireAuth } from "@/lib/ui/RequireAuth";

function normalizeTags(input: string) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ResearchPage() {
  return (
    <RequireAuth>
      <ResearchInner />
    </RequireAuth>
  );
}

function ResearchInner() {
  const user = useAuthUser();
  const sp = useSearchParams();
  const initialStrategyId = sp.get("strategyId") ?? "";

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [rows, setRows] = useState<ResearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [strategyIds, setStrategyIds] = useState<string[]>(
    initialStrategyId ? [initialStrategyId] : [],
  );

  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    return subscribeStrategies(setStrategies, (e) => setError(toErrorMessage(e)));
  }, []);

  useEffect(() => {
    return subscribeResearchItems(setRows, (e) => setError(toErrorMessage(e)));
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((r) => {
      const hay = [r.title, r.url ?? "", r.notes ?? "", ...(r.tags ?? [])]
        .join("\n")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q]);

  async function onCreate() {
    setError(null);
    setCreating(true);
    try {
      if (!title.trim()) throw new Error("Title is required.");

      await createResearchItem({
        title: title.trim(),
        url: url.trim(),
        notes: notes.trim(),
        tags: normalizeTags(tags),
        strategyIds,
      });

      setTitle("");
      setUrl("");
      setNotes("");
      setTags("");
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this research item?")) return;
    setError(null);
    try {
      await deleteResearchItem(id);
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    }
  }

  function toggleStrategy(id: string) {
    setStrategyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Research Vault</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Signed in as <span className="font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              href="/strategies"
            >
              Strategies
            </Link>
            <button
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              onClick={() => firebaseAuthAdapter.signOut()}
              type="button"
            >
              Sign out
            </button>
          </div>
        </header>

        {error ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </pre>
        ) : null}

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Add research item</h2>

          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Market outlook 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">URL</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Key takeaways, quotes, actions…"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Tags</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma, separated, tags"
                />
                <div className="mt-1 text-xs text-zinc-500">
                  Stored as an array; search matches tags too.
                </div>
              </div>

              <div>
                <div className="text-sm font-medium">Attach to strategies</div>
                <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-zinc-200 p-2">
                  {strategies.length === 0 ? (
                    <div className="text-sm text-zinc-600">
                      No strategies yet. Create one first.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {strategies.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={strategyIds.includes(s.id)}
                            onChange={() => toggleStrategy(s.id)}
                          />
                          <span className="truncate">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={onCreate}
            disabled={creating || !title.trim()}
          >
            {creating ? "Saving…" : "Save"}
          </button>
        </section>

        <section className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-700">Your research</h2>
              <div className="mt-1 text-xs text-zinc-500">
                {filtered.length} shown • {rows.length} total
              </div>
            </div>
            <input
              className="w-64 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title/url/notes/tags"
            />
          </div>

          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-zinc-600">No research items yet.</div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium">{r.title}</div>
                      {r.url ? (
                        <a
                          className="mt-1 block truncate text-sm text-blue-700 underline"
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.url}
                        </a>
                      ) : null}
                    </div>
                    <button
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                      onClick={() => onDelete(r.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>

                  {r.notes ? (
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-800">
                      {r.notes}
                    </pre>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(r.tags ?? []).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700"
                      >
                        {t}
                      </span>
                    ))}

                    {(r.strategyIds ?? []).length ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
                        strategies: {r.strategyIds.length}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
