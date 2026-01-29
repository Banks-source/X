import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { connectToEmulatorsIfNeeded, getFirebaseAuth } from "@/lib/firebase/client";

export type AuthUser = Pick<User, "uid" | "email">;

export type AuthAdapter = {
  getCurrentUser(): AuthUser | null;
  onChange(cb: (user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
};

export const firebaseAuthAdapter: AuthAdapter = {
  getCurrentUser() {
    const auth = getFirebaseAuth();
    connectToEmulatorsIfNeeded();
    const u = auth.currentUser;
    return u ? { uid: u.uid, email: u.email } : null;
  },

  onChange(cb) {
    const auth = getFirebaseAuth();
    connectToEmulatorsIfNeeded();
    return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null));
  },

  async signIn(email, password) {
    const auth = getFirebaseAuth();
    connectToEmulatorsIfNeeded();
    await signInWithEmailAndPassword(auth, email, password);
  },

  async signUp(email, password) {
    const auth = getFirebaseAuth();
    connectToEmulatorsIfNeeded();
    await createUserWithEmailAndPassword(auth, email, password);
  },

  async signOut() {
    const auth = getFirebaseAuth();
    connectToEmulatorsIfNeeded();
    await signOut(auth);
  },
};
