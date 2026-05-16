"use client";

import type { Ad } from "@/lib/types";
import { useAdStore } from "@/lib/store/ads";

interface AdStickyFooterProps {
  ad?: Ad | null;
}

export default function AdStickyFooter({ ad }: AdStickyFooterProps) {
  const dismissed = useAdStore((s) => s.dismissedIds.includes(ad?.id ?? ""));
  const dismiss = useAdStore((s) => s.dismiss);

  if (!ad || dismissed) return null;
  if (!ad.image_url && !ad.mobile_image_url) return null;

  const imgSrc = ad.mobile_image_url || ad.image_url!;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border shadow-lg animate-ad-overlay-in">
      <button
        onClick={() => dismiss(ad.id)}
        className="absolute -top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-muted hover:text-foreground shadow-sm z-10"
        aria-label="Cerrar aviso"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div className="flex items-center justify-center h-[50px]">
        <a
          href={ad.link_url || "#"}
          target={ad.link_url ? "_blank" : undefined}
          rel={ad.link_url ? "noopener noreferrer" : undefined}
          className="block h-full"
        >
          <img
            src={imgSrc}
            alt={ad.title || "Aviso publicitario"}
            className="h-[50px] w-auto object-contain"
          />
        </a>
      </div>
    </div>
  );
}