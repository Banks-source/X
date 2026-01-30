"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toErrorMessage } from "@/lib/errors";
import { computeAllocationByBucket, computeNetWorthByCategory } from "@/lib/netWorth";
import { Asset, Holding, subscribeAssets, subscribeHoldings, upsertAsset } from "@/lib/portfolio";
import { Strategy } from "@/lib/models";
import { subscribeStrategies } from "@/lib/strategies";
import { RequireAuth } from "@/lib/ui/RequireAuth";

function formatCurrency(n: number) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function formatPct(n: number) {
  const v = Number(n) || 0;
  return `${v.toFixed(1)}%`;
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyId, setStrategyId] = useState<string>("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingAssetId, setSavingAssetId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeStrategies(
      (rows) => {
        setStrategies(rows);
        if (!strategyId && rows.length > 0) setStrategyId(rows[0].id);
      },
      (e) => setError(toErrorMessage(e)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!strategyId) return;
    return subscribeAssets(strategyId, setAssets, (e) => setError(toErrorMessage(e)));
  }, [strategyId]);

  useEffect(() => {
    if (!strategyId) return;
    return subscribeHoldings(strategyId, setHoldings, (e) => setError(toErrorMessage(e)));
  }, [strategyId]);

  const strategy = useMemo(
    () => strategies.find((s) => s.id === strategyId) ?? null,
    [strategies, strategyId],
  );

  const nw = useMemo(() => computeNetWorthByCategory(assets, holdings), [assets, holdings]);

  const alloc = useMemo(() => {
    if (!strategy) return null;
    return computeAllocationByBucket(strategy, assets, holdings);
  }, [strategy, assets, holdings]);

  async function onAssignAssetToBucket(asset: Asset, bucketIdRaw: string) {
    setError(null);
    setSavingAssetId(asset.id);
    try {
      const bucketId = bucketIdRaw === "" ? "" : bucketIdRaw;
      await upsertAsset(asset.strategyId, {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        notes: asset.notes ?? "",
        bucketId,
      });
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    } finally {
      setSavingAssetId(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="mt-1 text-sm text-zinc-600">
              Net worth snapshot + allocation drift (manual mapping).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link className="text-sm underline" href="/strategies">
              Strategies
            </Link>
            <select
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
            >
              <option value="" disabled>
                Select strategy…
              </option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>
        </header>

        {error ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </pre>
        ) : null}

        {!strategy ? (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-zinc-600">Create a strategy to see your dashboard.</div>
          </div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-zinc-500">Total net worth</div>
                <div className="mt-2 text-3xl font-semibold">{formatCurrency(nw.total)}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  Based on latest holding per asset.
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold text-zinc-500">Breakdown</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(nw.breakdown).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
                    >
                      <span className="capitalize text-zinc-700">{k}</span>
                      <span className="font-medium">{formatCurrency(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 p-4">
                <div>
                  <div className="text-sm font-semibold">Allocation vs targets</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Assign each asset to a bucket below to compute allocation.
                  </div>
                </div>
                {alloc?.unassignedValue ? (
                  <div className="text-xs text-amber-700">
                    Unassigned value: {formatCurrency(alloc.unassignedValue)}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500">
                    Unassigned value: {formatCurrency(0)}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto p-4">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-zinc-600">
                    <tr>
                      <th className="py-2 pr-3">Bucket</th>
                      <th className="py-2 pr-3">Target</th>
                      <th className="py-2 pr-3">Current</th>
                      <th className="py-2 pr-3">Drift</th>
                      <th className="py-2 pr-3">Value</th>
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    {(alloc?.rows ?? []).map((r) => (
                      <tr key={r.bucketId} className="border-t border-zinc-100">
                        <td className="py-2 pr-3 font-medium">{r.name || "(unnamed)"}</td>
                        <td className="py-2 pr-3">{formatPct(r.targetPercent)}</td>
                        <td className="py-2 pr-3">{formatPct(r.currentPercent)}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={
                              r.driftPercent > 0.5
                                ? "text-red-700"
                                : r.driftPercent < -0.5
                                  ? "text-emerald-700"
                                  : "text-zinc-700"
                            }
                          >
                            {formatPct(r.driftPercent)}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{formatCurrency(r.currentValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 p-4">
                <div className="text-sm font-semibold">Asset → bucket mapping</div>
                <div className="mt-1 text-xs text-zinc-500">
                  This is manual for now. Once set, drift is computed from latest holdings.
                </div>
              </div>

              {assets.length === 0 ? (
                <div className="p-4 text-sm text-zinc-600">
                  No assets yet. Import Kubera CSV on the strategy page.
                </div>
              ) : (
                <div className="overflow-x-auto p-4">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs text-zinc-600">
                      <tr>
                        <th className="py-2 pr-3">Asset</th>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Bucket</th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {assets.map((a) => (
                        <tr key={a.id} className="border-t border-zinc-100">
                          <td className="py-2 pr-3 font-medium">{a.name}</td>
                          <td className="py-2 pr-3 capitalize">{a.category}</td>
                          <td className="py-2 pr-3">
                            <select
                              className="w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                              value={a.bucketId ?? ""}
                              onChange={(e) => void onAssignAssetToBucket(a, e.target.value)}
                              disabled={savingAssetId === a.id}
                            >
                              <option value="">Unassigned</option>
                              {(strategy.buckets ?? []).map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name || "(unnamed)"}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
