import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  connectToEmulatorsIfNeeded,
  getFirebaseAuth,
  getFirestoreDb,
} from "@/lib/firebase/client";

export type AssetCategory = "property" | "cash" | "brokerage" | "crypto" | "other";

export type Asset = {
  id: string;
  strategyId: string;
  ownerUid?: string;
  name: string;
  category: AssetCategory;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Holding = {
  id: string;
  strategyId: string;
  ownerUid?: string;
  assetId: string;
  asOf: string; // YYYY-MM-DD
  value: number; // base currency (AUD for now)
  source?: string; // e.g. kubera
  createdAt?: unknown;
};

export type ImportRun = {
  id: string;
  strategyId: string;
  ownerUid?: string;
  source: string; // e.g. "kubera"
  createdAt?: unknown;
  rowCount?: number;
  notes?: string;
};

export type WeeklyReport = {
  id: string;
  strategyId: string;
  ownerUid?: string;
  createdAt?: unknown;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  netWorth: number;
  breakdown: Record<AssetCategory, number>;
  driftSummary: string;
  notes: string;
};

function requireAuthUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  return uid;
}

function strategyRef(strategyId: string) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  return doc(db, "strategies", strategyId);
}

function assetsCol(strategyId: string) {
  return collection(strategyRef(strategyId), "assets");
}

function holdingsCol(strategyId: string) {
  return collection(strategyRef(strategyId), "holdings");
}

function importRunsCol(strategyId: string) {
  return collection(strategyRef(strategyId), "importRuns");
}

function reportsCol(strategyId: string) {
  return collection(strategyRef(strategyId), "reports");
}

export async function upsertAsset(
  strategyId: string,
  input: Omit<Asset, "id" | "strategyId" | "ownerUid" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
) {
  const ownerUid = requireAuthUid();
  const now = serverTimestamp();

  if (input.id) {
    await setDoc(
      doc(assetsCol(strategyId), input.id),
      {
        ownerUid,
        name: input.name,
        category: input.category,
        notes: input.notes ?? "",
        updatedAt: now,
      },
      { merge: true },
    );
    return input.id;
  }

  const ref = await addDoc(assetsCol(strategyId), {
    ownerUid,
    name: input.name,
    category: input.category,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function createHolding(
  strategyId: string,
  input: Omit<Holding, "id" | "strategyId" | "ownerUid" | "createdAt">,
) {
  const ownerUid = requireAuthUid();
  const now = serverTimestamp();
  const ref = await addDoc(holdingsCol(strategyId), {
    ownerUid,
    assetId: input.assetId,
    asOf: input.asOf,
    value: input.value,
    source: input.source ?? "",
    createdAt: now,
  });
  return ref.id;
}

export async function createImportRun(
  strategyId: string,
  params: { source: string; rowCount?: number; notes?: string },
) {
  const ownerUid = requireAuthUid();
  const now = serverTimestamp();
  const ref = await addDoc(importRunsCol(strategyId), {
    ownerUid,
    source: params.source,
    rowCount: params.rowCount ?? 0,
    notes: params.notes ?? "",
    createdAt: now,
  });
  return ref.id;
}

export function subscribeAssets(
  strategyId: string,
  cb: (rows: Asset[]) => void,
  onError?: (e: unknown) => void,
) {
  const q = query(assetsCol(strategyId), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          strategyId,
          ...(d.data() as any),
        })) as Asset[],
      );
    },
    (err) => onError?.(err),
  );
}

export function subscribeHoldings(
  strategyId: string,
  cb: (rows: Holding[]) => void,
  onError?: (e: unknown) => void,
) {
  const q = query(holdingsCol(strategyId), orderBy("asOf", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          strategyId,
          ...(d.data() as any),
        })) as Holding[],
      );
    },
    (err) => onError?.(err),
  );
}

export async function createWeeklyReport(
  strategyId: string,
  input: Omit<WeeklyReport, "id" | "strategyId" | "ownerUid" | "createdAt">,
) {
  const ownerUid = requireAuthUid();
  const now = serverTimestamp();
  const ref = await addDoc(reportsCol(strategyId), {
    ownerUid,
    ...input,
    createdAt: now,
  });
  return ref.id;
}

export function subscribeWeeklyReports(
  strategyId: string,
  cb: (rows: WeeklyReport[]) => void,
  onError?: (e: unknown) => void,
) {
  const q = query(reportsCol(strategyId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          strategyId,
          ...(d.data() as any),
        })) as WeeklyReport[],
      );
    },
    (err) => onError?.(err),
  );
}

export async function listAssets(strategyId: string): Promise<Asset[]> {
  const snap = await getDocs(assetsCol(strategyId));
  return snap.docs.map((d) => ({ id: d.id, strategyId, ...(d.data() as any) })) as Asset[];
}

export async function listHoldings(strategyId: string): Promise<Holding[]> {
  const snap = await getDocs(holdingsCol(strategyId));
  return snap.docs.map((d) => ({ id: d.id, strategyId, ...(d.data() as any) })) as Holding[];
}
