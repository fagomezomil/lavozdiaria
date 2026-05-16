"use client";

import { useFavoritesStore } from "@/lib/store/favorites";
import { useAuthStore } from "@/lib/store/auth";
import type { LocalArticleData } from "@/lib/store/likes";

interface FavoriteButtonProps {
  articleId: string;
  isCustom: boolean;
  articleData?: LocalArticleData;
}

export default function FavoriteButton({ articleId, isCustom, articleData }: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user);
  const isFavorited = useFavoritesStore((s) => s.isFavorited(articleId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  if (!user) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(articleId, isCustom, articleData);
      }}
      className="inline-flex items-center gap-1 group"
      aria-label={isFavorited ? "Quitar de favoritos" : "Guardar en favoritos"}
    >
      <svg
        className={`w-5 h-5 transition-transform group-hover:scale-110 ${isFavorited ? "text-[#f59e0b] fill-[#f59e0b]" : "text-muted fill-none"}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span className={`text-xs font-semibold ${isFavorited ? "text-[#f59e0b]" : "text-muted"}`}>
        {isFavorited ? "Guardado" : "Guardar"}
      </span>
    </button>
  );
}