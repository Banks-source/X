"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { firebaseAuthAdapter } from "@/lib/auth/auth";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { RequireAuth } from "@/lib/ui/RequireAuth";
import { toErrorMessage } from "@/lib/errors";
import { createStrategy, deleteStrategy, subscribeStrategies } from "@/lib/strategies";
import { Strategy, StrategyType } from "@/lib/models";

export default function StrategiesPage() {
  return (
    <RequireAuth>
      <StrategiesInner />
    </RequireAuth>
  );
}

function StrategiesInner() {
  const user = useAuthUser();
  const [rows, setRows] = useState<Strategy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("My Strategy");
  const [type, setType] = useState<StrategyType>("Personal");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    return subscribeStrategies(setRows, (e) => setError(toErrorMessage(e)));
  }, []);

  async function onCreate() {
    setError(null);
    setCreating(true);
    try {
      const id = await createStrategy({ name, type, goal, notes, description: desc });
      setName("My Strategy");
      setType("Personal");
      setGoal("");
      setNotes("");
      setDesc("");
      // Navigate to the editor.
      window.location.href = `/strategies/${id}`;
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this strategy?")) return;
    setError(null);
    try {
      await deleteStrategy(id);
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Strategies</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Signed in as <span className="font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              href="/research"
            >
              Research
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
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>
        ) : null}

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Create strategy</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
            <select
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as StrategyType)}
            >
              <option value="Personal">Personal</option>
              <option value="SMSF">SMSF</option>
            </select>
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder='Goal (e.g. "10M / 20y")'
            />
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
            />
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm sm:col-span-3"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)"
            />
          </div>
          <button
            className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={onCreate}
            disabled={creating || !name.trim()}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </section>

        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">Your strategies</h2>
            <span className="text-xs text-zinc-500">{rows.length} total</span>
          </div>

          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm">
            {rows.length === 0 ? (
              <div className="p-4 text-sm text-zinc-600">No strategies yet.</div>
            ) : (
              rows.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">Type: {s.type}</div>
                    {s.goal ? (
                      <div className="truncate text-xs text-zinc-500">Goal: {s.goal}</div>
                    ) : null}
                    {s.description ? (
                      <div className="truncate text-sm text-zinc-600">{s.description}</div>
                    ) : null}
                    <div className="mt-1 text-xs text-zinc-500">
                      Buckets: {s.buckets?.length ?? 0}
                    </div>
                  </div>

                  <div className="flex flex-none items-center gap-2">
                    <Link
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                      href={`/strategies/${s.id}`}
                    >
                      Edit
                    </Link>
                    <button
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                      onClick={() => onDelete(s.id)}
                      type="button"
                    >
                      Delete
                    </button>
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
