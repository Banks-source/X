import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";

// NOTE: This module must only be imported from Client Components.

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _emulatorsConnected = false;

function getEnv(name: string, fallback?: string) {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  return fallback;
}

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;

  // Defaults are set to the real prod project so App Hosting works even if env injection is flaky.
  // (These values are public by design; Firebase client keys are not secrets.)
  const projectId = getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "twenty10-51ec4");

  const config = {
    apiKey: getEnv(
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "AIzaSyCRlMUJ4D2RYV84u1GrNBOb54fPAvsf30M",
    ),
    authDomain: getEnv(
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "twenty10-51ec4.firebaseapp.com",
    ),
    projectId,
  };

  _app = getApps().length ? getApps()[0]! : initializeApp(config);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirestoreDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getFirebaseApp());
  return _db;
}

export function connectToEmulatorsIfNeeded() {
  if (_emulatorsConnected) return;

  const useEmulator =
    getEnv("NEXT_PUBLIC_USE_FIREBASE_EMULATOR") === "1" ||
    getEnv("NEXT_PUBLIC_USE_FIREBASE_EMULATOR") === "true";

  if (!useEmulator) return;

  // Guard: avoid duplicate emulator connections on hot reload.
  // Firebase SDK throws if connect*Emulator is called multiple times.
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();

  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);

  _emulatorsConnected = true;
}

export function subscribeAuthDebugLogger() {
  // Useful during emulator-first development.
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    // Intentionally useful during dev; keep if you want local debugging.
    console.log("[auth] state", user ? { uid: user.uid, email: user.email } : null);
  });
}
