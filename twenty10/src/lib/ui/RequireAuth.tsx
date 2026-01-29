"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [user, router, pathname]);

  if (!user) return null;
  return <>{children}</>;
}
