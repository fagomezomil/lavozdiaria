"use client";

import type { Ad } from "@/lib/types";
import Link from "next/link";
import { useAdStore } from "@/lib/store/ads";

interface AdInFeedProps {
  ad: Ad;
}

export default function AdInFeed({ ad }: AdInFeedProps) {
  const dismissed = useAdStore((s) => s.dismissedIds.includes(ad.id));
  const dismiss = useAdStore((s) => s.dismiss);

  if (dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismiss(ad.id);
  };

  const imgSrc = ad.mobile_image_url || ad.image_url;

  return (
    <div className="bg-paper border border-border overflow-hidden group/ad rounded-sm relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 w-5 h-5 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-xs opacity-0 group-hover/ad:opacity-100 transition-opacity"
        aria-label="Ocultar aviso"
      >
        &times;
      </button>
      <Link
        href={ad.link_url || "#"}
        target={ad.link_url ? "_blank" : undefined}
        rel={ad.link_url ? "noopener noreferrer" : undefined}
        className="block"
      >
        {imgSrc ? (
          <picture>
            <source media="(max-width: 767px)" srcSet={ad.mobile_image_url || ad.image_url!} />
            <img
              src={ad.image_url!}
              alt={ad.title || "Aviso publicitario"}
              className="w-full h-44 object-cover group-hover/ad:scale-[1.02] transition-transform duration-300"
            />
          </picture>
        ) : (
          <div className="w-full h-44 bg-[#f0efed] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#ccc]"
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
          </div>
        )}
        <div className="p-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted">
            Aviso publicitario
          </span>
          <h3 className="mt-1 text-lg font-bold leading-snug font-[family-name:var(--font-heading)]">
            {ad.title || "Aviso publicitario"}
          </h3>
        </div>
      </Link>
    </div>
  );
}