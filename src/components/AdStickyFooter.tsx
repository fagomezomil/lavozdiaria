"use client";

import type { Ad } from "@/lib/types";

interface AdStickyFooterProps {
  ad?: Ad | null;
}

export default function AdStickyFooter({ ad }: AdStickyFooterProps) {
  if (!ad) return null;
  if (!ad.image_url && !ad.mobile_image_url) return null;

  const imgSrc = ad.mobile_image_url || ad.image_url!;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border shadow-lg animate-ad-overlay-in">
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