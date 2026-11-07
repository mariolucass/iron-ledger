"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/entities/user";

export function useSignOut(onComplete?: () => void) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await userApi.logout();
    } finally {
      queryClient.clear();
      onComplete?.();
      router.replace("/login");
      router.refresh();
    }
  };

  return { signOut, isSigningOut };
}
