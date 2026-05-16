"use client";

import { useLikesStore } from "@/lib/store/likes";
import { useAuthStore } from "@/lib/store/auth";
import type { LocalArticleData } from "@/lib/store/likes";

interface LikeButtonProps {
  articleId: string;
  isCustom: boolean;
  articleData?: LocalArticleData;
}

export default function LikeButton({ articleId, isCustom, articleData }: LikeButtonProps) {
  const user = useAuthStore((s) => s.user);
  const isLiked = useLikesStore((s) => s.isLiked(articleId));
  const toggleLike = useLikesStore((s) => s.toggleLike);

  if (!user) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLike(articleId, isCustom, articleData);
      }}
      className="inline-flex items-center gap-1 group"
      aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}
    >
      <svg
        className={`w-5 h-5 transition-transform group-hover:scale-110 ${isLiked ? "text-[#e63946] fill-[#e63946]" : "text-muted fill-none"}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span className={`text-xs font-semibold ${isLiked ? "text-[#e63946]" : "text-muted"}`}>
        {isLiked ? "Me gusta" : "Me gusta"}
      </span>
    </button>
  );
}