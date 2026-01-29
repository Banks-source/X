export type AllocationBucket = {
  id: string;
  name: string;
  percent: number; // 0..100
};

export type Strategy = {
  id: string;
  name: string;
  description?: string;
  buckets: AllocationBucket[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export function validateBuckets(buckets: AllocationBucket[]) {
  const errors: string[] = [];

  if (buckets.length === 0) errors.push("Add at least 1 allocation bucket.");

  let sum = 0;
  for (const b of buckets) {
    if (!b.name.trim()) errors.push("Bucket name cannot be empty.");
    if (!Number.isFinite(b.percent)) errors.push(`Bucket percent must be a number (${b.name || b.id}).`);
    if (b.percent < 0) errors.push(`Bucket percent cannot be negative (${b.name || b.id}).`);
    sum += b.percent;
  }

  if (Math.round(sum * 100) / 100 !== 100) {
    errors.push(`Bucket percents must sum to 100 (currently ${sum}).`);
  }

  return {
    ok: errors.length === 0,
    errors,
    sum,
  };
}
