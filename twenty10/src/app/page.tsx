import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Twenty10</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Dev-only build: Firebase Auth + Firestore emulators.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Login
          </Link>
          <Link
            href="/strategies"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium"
          >
            Strategies
          </Link>
        </div>

        <div className="mt-6 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">Quick start</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs">
            {`npm run emulators\n# in another terminal\nnpm run dev:emulators`}
          </pre>
        </div>
      </div>
    </div>
  );
}
