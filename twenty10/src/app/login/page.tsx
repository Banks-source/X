"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuthAdapter } from "@/lib/auth/auth";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { toErrorMessage } from "@/lib/errors";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 p-6">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const user = useAuthUser();
  const router = useRouter();
  const sp = useSearchParams();

  const nextPath = useMemo(() => sp.get("next") || "/strategies", [sp]);

  const [email, setEmail] = useState("dev@example.com");
  const [password, setPassword] = useState("password123");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    router.replace(nextPath);
    return null;
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") await firebaseAuthAdapter.signIn(email, password);
      else await firebaseAuthAdapter.signUp(email, password);
      router.replace(nextPath);
    } catch (e: unknown) {
      setError(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Twenty10 (Dev)</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sign in with email/password against the Firebase Auth emulator.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "signin" ? "bg-zinc-900 text-white" : "bg-zinc-100"
            }`}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "signup" ? "bg-zinc-900 text-white" : "bg-zinc-100"
            }`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <label className="mt-4 block text-sm font-medium">Email</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="mt-4 block text-sm font-medium">Password</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>
        ) : null}

        <button
          className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={submit}
          disabled={loading || !email || password.length < 6}
        >
          {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <p className="mt-4 text-xs text-zinc-500">
          Tip: the Auth emulator persists locally. Use the Emulator UI (localhost:4000)
          to inspect users.
        </p>
      </div>
    </div>
  );
}
