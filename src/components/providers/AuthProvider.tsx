"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useLikesStore } from "@/lib/store/likes";
import { useFavoritesStore } from "@/lib/store/favorites";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const initLikes = useLikesStore((s) => s.initialize);
  const initFavorites = useFavoritesStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize likes/favorites stores when user changes
  useEffect(() => {
    if (user) {
      initLikes(user.id);
      initFavorites(user.id);
    }
  }, [user, initLikes, initFavorites]);

  return <>{children}</>;
}