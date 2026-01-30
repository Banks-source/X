import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb, connectToEmulatorsIfNeeded } from "@/lib/firebase/client";
import { AllocationBucket, Strategy } from "@/lib/models";
import { DEFAULT_BUCKETS } from "@/lib/defaults";

type StrategyDoc = {
  name?: unknown;
  description?: unknown;
  buckets?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toStrategy(id: string, data: StrategyDoc): Strategy {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    description: typeof data.description === "string" ? data.description : "",
    buckets: Array.isArray(data.buckets) ? (data.buckets as AllocationBucket[]) : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export type StrategyInput = {
  name: string;
  description?: string;
};

export type StrategyUpdate = Partial<StrategyInput> & {
  buckets?: AllocationBucket[];
};

function strategiesCol() {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  return collection(db, "strategies");
}

export function subscribeStrategies(
  cb: (rows: Strategy[]) => void,
  onError?: (err: unknown) => void,
) {
  const q = query(strategiesCol(), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => toStrategy(d.id, d.data() as StrategyDoc)),

      );
    },
    (err) => onError?.(err),
  );
}

export async function createStrategy(input: StrategyInput) {
  const col = strategiesCol();
  const now = serverTimestamp();
  const docRef = await addDoc(col, {
    name: input.name,
    description: input.description ?? "",
    buckets: DEFAULT_BUCKETS,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function deleteStrategy(id: string) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  await deleteDoc(doc(db, "strategies", id));
}

export async function getStrategy(id: string): Promise<Strategy | null> {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, "strategies", id));
  if (!snap.exists()) return null;
  return toStrategy(snap.id, snap.data() as StrategyDoc);
}

export function subscribeStrategy(
  id: string,
  cb: (row: Strategy | null) => void,
  onError?: (err: unknown) => void,
) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  return onSnapshot(
    doc(db, "strategies", id),
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      cb(toStrategy(snap.id, snap.data() as StrategyDoc));
    },
    (err) => onError?.(err),
  );
}

export async function updateStrategy(id: string, update: StrategyUpdate) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  await updateDoc(doc(db, "strategies", id), {
    ...update,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}

export async function setStrategy(id: string, data: Strategy) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  await setDoc(doc(db, "strategies", id), {
    name: data.name,
    description: data.description ?? "",
    buckets: data.buckets,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}
