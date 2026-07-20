"use client";

import Link from "next/link";
import type { Ad } from "@/lib/types";

interface AdSlotProps {
  size?: "leaderboard" | "rectangle" | "sidebar" | "infeed" | "sticky_footer";
  className?: string;
  ad?: Ad | null;
}

// Relaciones de aspecto estándar — mismas en desktop y mobile (ver AdRotator.tsx).
const sizeStyles: Record<string, string> = {
  leaderboard: "w-full aspect-[8/1]",
  rectangle: "w-full aspect-[8/5]",
  sidebar: "w-full aspect-[8/5]",
  infeed: "w-full aspect-[8/5]",
  sticky_footer: "w-full aspect-[8/1]",
};

export default function AdSlot({ size = "leaderboard", className = "", ad }: AdSlotProps) {
  // If we have a real ad with an image, render it
  if (ad?.image_url) {
    const mobileSrc = ad.mobile_image_url || ad.image_url;

    const inner = (
      <div className={`relative overflow-hidden rounded-sm bg-paper ${sizeStyles[size]} ${className} group/ad`}>
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileSrc} />
          <img
            src={ad.image_url}
            alt={ad.title || "Aviso publicitario"}
            className="w-full h-full object-contain"
          />
        </picture>
      </div>
    );

    if (ad.link_url) {
      return (
        <Link href={ad.link_url} target="_blank" rel="noopener noreferrer">
          {inner}
        </Link>
      );
    }
    return inner;
  }

  // Fallback: placeholder
  return (
    <div
      className={`flex items-center justify-center border-2 border-dashed border-[#d4cfc7] rounded-sm bg-[#f0efed] ${sizeStyles[size]} ${className}`}
      aria-label="Espacio publicitario"
    >
      <div className="text-center px-4">
        <svg
          className="mx-auto mb-1 w-5 h-5 text-[#bbb]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xs tracking-widest uppercase text-[#9a9a9a] font-medium">
          Espacio publicitario
        </span>
      </div>
    </div>
  );
}