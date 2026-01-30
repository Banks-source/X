import { Strategy } from "@/lib/models";
import { Asset, AssetCategory, Holding } from "@/lib/portfolio";

export type NetWorthBreakdown = Record<AssetCategory, number>;

export function emptyBreakdown(): NetWorthBreakdown {
  return {
    property: 0,
    cash: 0,
    brokerage: 0,
    crypto: 0,
    other: 0,
  };
}

export function latestHoldingsByAsset(holdings: Holding[]): Map<string, Holding> {
  const m = new Map<string, Holding>();
  for (const h of holdings) {
    const prev = m.get(h.assetId);
    if (!prev || (h.asOf || "") > (prev.asOf || "")) {
      m.set(h.assetId, h);
    }
  }
  return m;
}

export function computeNetWorthByCategory(assets: Asset[], holdings: Holding[]) {
  const latest = latestHoldingsByAsset(holdings);
  const catByAsset = new Map<string, AssetCategory>();
  for (const a of assets) catByAsset.set(a.id, a.category);

  const breakdown = emptyBreakdown();

  for (const h of latest.values()) {
    const cat = catByAsset.get(h.assetId) ?? "other";
    breakdown[cat] += Number(h.value) || 0;
  }

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total, breakdown };
}

export function computeAllocationByBucket(
  strategy: Strategy,
  assets: Asset[],
  holdings: Holding[],
) {
  const latest = latestHoldingsByAsset(holdings);

  const assetById = new Map<string, Asset>();
  for (const a of assets) assetById.set(a.id, a);

  const valueByBucketId = new Map<string, number>();
  let unassignedValue = 0;

  for (const h of latest.values()) {
    const a = assetById.get(h.assetId);
    const value = Number(h.value) || 0;
    const bucketId = a?.bucketId;

    if (!bucketId) {
      unassignedValue += value;
      continue;
    }

    valueByBucketId.set(bucketId, (valueByBucketId.get(bucketId) ?? 0) + value);
  }

  const total = Array.from(valueByBucketId.values()).reduce((a, b) => a + b, 0) + unassignedValue;

  const rows = (strategy.buckets ?? []).map((b) => {
    const currentValue = valueByBucketId.get(b.id) ?? 0;
    const currentPercent = total > 0 ? (currentValue / total) * 100 : 0;
    const targetPercent = Number(b.percent) || 0;
    const driftPercent = currentPercent - targetPercent;

    return {
      bucketId: b.id,
      name: b.name,
      targetPercent,
      currentValue,
      currentPercent,
      driftPercent,
    };
  });

  return { total, unassignedValue, rows };
}
