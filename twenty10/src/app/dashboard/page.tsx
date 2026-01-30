"use client";

import Link from "next/link";
import { RequireAuth } from "@/lib/ui/RequireAuth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-600">
            MVP for issue #8 is in progress. For now, pick a strategy and view its dashboard on the
            strategy page.
          </p>
          <div className="mt-4 text-sm">
            Go to <Link className="underline" href="/strategies">Strategies</Link>.
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
