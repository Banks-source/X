import { AllocationBucket } from "@/lib/models";

// Default allocation buckets for a new strategy.
// Tune these numbers once Lloyd confirms preferences.
export const DEFAULT_BUCKETS: AllocationBucket[] = [
  { id: crypto.randomUUID(), name: "Safe", percent: 50 },
  { id: crypto.randomUUID(), name: "Growth", percent: 40 },
  { id: crypto.randomUUID(), name: "Asymmetric", percent: 10 },
];
