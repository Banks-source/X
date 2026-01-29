"use client";

import { useEffect, useState } from "react";
import { AuthUser, firebaseAuthAdapter } from "@/lib/auth/auth";

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() =>
    firebaseAuthAdapter.getCurrentUser(),
  );

  useEffect(() => {
    return firebaseAuthAdapter.onChange(setUser);
  }, []);

  return user;
}
