import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { connectToEmulatorsIfNeeded, getFirebaseAuth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/users";

export type AuthUser = Pick<User, "uid" | "email">;

export type AuthAdapter = {
  getCurrentUser(): AuthUser | null;
  onChange(cb: (user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
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
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        cb(null);
        return;
      }

      // Ensure a user profile doc exists on first login.
      // Fire-and-forget; we don't want auth rendering blocked by Firestore.
      void ensureUserProfile({
        uid: u.uid,
        email: u.email || "",
        displayName: u.displayName,
        photoURL: u.photoURL,
      });

      cb({ uid: u.uid, email: u.email });
    });
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

  async signInWithGoogle() {
    const auth = getFirebaseAuth();
    connectToEmulatorsIfNeeded();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  },

  async signOut() {
    const auth = getFirebaseAuth();
    connectToEmulatorsIfNeeded();
    await signOut(auth);
  },
};
