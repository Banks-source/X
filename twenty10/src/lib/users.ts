import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { connectToEmulatorsIfNeeded, getFirestoreDb } from "@/lib/firebase/client";

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: unknown;
  lastLoginAt?: unknown;
};

export async function ensureUserProfile(params: {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}) {
  connectToEmulatorsIfNeeded();
  const db = getFirestoreDb();

  const ref = doc(db, "users", params.uid);
  const snap = await getDoc(ref);

  const now = serverTimestamp();

  // Only set createdAt on first creation.
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: params.uid,
      email: params.email,
      displayName: params.displayName ?? "",
      photoURL: params.photoURL ?? "",
      createdAt: now,
      lastLoginAt: now,
    } satisfies UserProfile);
    return;
  }

  // For now, update lastLoginAt and basic profile fields.
  await setDoc(
    ref,
    {
      email: params.email,
      displayName: params.displayName ?? "",
      photoURL: params.photoURL ?? "",
      lastLoginAt: now,
    },
    { merge: true },
  );
}
