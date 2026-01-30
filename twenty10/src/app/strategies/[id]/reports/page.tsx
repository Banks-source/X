"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/lib/ui/RequireAuth";
import { toErrorMessage } from "@/lib/errors";
import {
  Asset,
  Holding,
  createWeeklyReport,
  subscribeAssets,
  subscribeHoldings,
  subscribeWeeklyReports,
  WeeklyReport,
} from "@/lib/portfolio";
import { computeNetWorthByCategory } from "@/lib/netWorth";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReportsPage() {
  return (
    <RequireAuth>
      <ReportsInner />
    </RequireAuth>
  );
}

function ReportsInner() {
  const params = useParams<{ id: string }>();
  const strategyId = params.id;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(
    () => subscribeAssets(strategyId, setAssets, (e) => setError(toErrorMessage(e))),
    [strategyId],
  );
  useEffect(
    () => subscribeHoldings(strategyId, setHoldings, (e) => setError(toErrorMessage(e))),
    [strategyId],
  );
  useEffect(
    () =>
      subscribeWeeklyReports(strategyId, setReports, (e) => setError(toErrorMessage(e))),
    [strategyId],
  );

  const nw = useMemo(() => computeNetWorthByCategory(assets, holdings), [assets, holdings]);

  async function onGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const endDate = todayISO();
      const startDate = endDate; // MVP: single-day snapshot; improve later.

      await createWeeklyReport(strategyId, {
        startDate,
        endDate,
        netWorth: nw.total,
        breakdown: nw.breakdown,
        driftSummary: "",
        notes: "",
      });
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl">
        <Link href={`/strategies/${strategyId}`} className="text-sm text-zinc-600 underline">
          ← Back
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Weekly reports</h1>
          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={onGenerate}
            disabled={generating}
            type="button"
          >
            {generating ? "Generating…" : "Generate report"}
          </button>
        </div>

        {error ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </pre>
        ) : null}

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-4 text-sm font-semibold">Saved reports</div>
          {reports.length === 0 ? (
            <div className="p-4 text-sm text-zinc-600">No reports yet.</div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {reports.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="font-medium">
                    {r.startDate} → {r.endDate}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">Net worth: ${r.netWorth}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
