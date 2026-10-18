"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { userApi } from "@/entities/user";

export function useSignOut(onComplete?: () => void) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await userApi.logout();
    } finally {
      onComplete?.();
      router.replace("/login");
      router.refresh();
    }
  };

  return { signOut, isSigningOut };
}
