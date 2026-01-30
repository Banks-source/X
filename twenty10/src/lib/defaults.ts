import { AllocationBucket } from "@/lib/models";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

// Default allocation buckets for a new strategy.
// NOTE: This must be a function so each new strategy gets unique bucket IDs.
// Tune these numbers once Lloyd confirms preferences.
export function defaultBuckets(): AllocationBucket[] {
  return [
    { id: newId(), name: "Safe", percent: 50 },
    { id: newId(), name: "Growth", percent: 40 },
    { id: newId(), name: "Asymmetric", percent: 10 },
  ];
}
