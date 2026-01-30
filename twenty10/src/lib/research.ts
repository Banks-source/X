import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { connectToEmulatorsIfNeeded, getFirestoreDb } from "@/lib/firebase/client";
import { firebaseAuthAdapter } from "@/lib/auth/auth";
import { ResearchItem } from "@/lib/models";

type ResearchDoc = {
  userId?: unknown;
  title?: unknown;
  url?: unknown;
  notes?: unknown;
  tags?: unknown;
  strategyIds?: unknown;
  assetIds?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toResearchItem(id: string, data: ResearchDoc): ResearchItem {
  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    title: typeof data.title === "string" ? data.title : "",
    url: typeof data.url === "string" ? data.url : "",
    notes: typeof data.notes === "string" ? data.notes : "",
    tags: Array.isArray(data.tags) ? (data.tags as string[]).filter((x) => typeof x === "string") : [],
    strategyIds: Array.isArray(data.strategyIds)
      ? (data.strategyIds as string[]).filter((x) => typeof x === "string")
      : [],
    assetIds: Array.isArray(data.assetIds)
      ? (data.assetIds as string[]).filter((x) => typeof x === "string")
      : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function researchCol() {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  return collection(db, "researchItems");
}

export type ResearchInput = {
  title: string;
  url?: string;
  notes?: string;
  tags?: string[];
  strategyIds?: string[];
  assetIds?: string[];
};

export type ResearchUpdate = Partial<ResearchInput>;

export function subscribeResearchItems(
  cb: (rows: ResearchItem[]) => void,
  onError?: (err: unknown) => void,
) {
  const user = firebaseAuthAdapter.getCurrentUser();
  if (!user) {
    cb([]);
    return () => {};
  }

  const q = query(
    researchCol(),
    where("userId", "==", user.uid),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => toResearchItem(d.id, d.data() as ResearchDoc)));
    },
    (err) => onError?.(err),
  );
}

export async function createResearchItem(input: ResearchInput) {
  const user = firebaseAuthAdapter.getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const now = serverTimestamp();
  const docRef = await addDoc(researchCol(), {
    userId: user.uid,
    title: input.title,
    url: input.url ?? "",
    notes: input.notes ?? "",
    tags: input.tags ?? [],
    strategyIds: input.strategyIds ?? [],
    assetIds: input.assetIds ?? [],
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function updateResearchItem(id: string, update: ResearchUpdate) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  await updateDoc(doc(db, "researchItems", id), {
    ...update,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
}

export async function deleteResearchItem(id: string) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();
  await deleteDoc(doc(db, "researchItems", id));
}
