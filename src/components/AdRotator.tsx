"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Ad } from "@/lib/types";
import { useAdStore } from "@/lib/store/ads";

interface AdRotatorProps {
  ads: Ad[];
  size: "leaderboard" | "rectangle" | "sidebar" | "infeed" | "sticky_footer";
  className?: string;
}

const sizeStyles: Record<string, string> = {
  leaderboard: "w-full h-[50px] md:h-[90px]",
  rectangle: "w-full h-[150px] md:h-[250px]",
  sidebar: "w-full h-[150px] md:h-[250px]",
  infeed: "w-full",
  sticky_footer: "w-full h-[50px]",
};

const DEFAULT_DURATION = 15;
const FADE_MS = 300;

export default function AdRotator({ ads, size, className = "" }: AdRotatorProps) {
  const [startIndex] = useState(() => Math.floor(Math.random() * 1000));
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * (ads.length || 1)));
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const dismissedIds = useAdStore((s) => s.dismissedIds);
  const dismiss = useAdStore((s) => s.dismiss);

  // Filter out dismissed ads
  const activeAds = useMemo(
    () => ads.filter((ad) => !dismissedIds.includes(ad.id) && ad.image_url),
    [ads, dismissedIds]
  );

  const currentAd = activeAds[currentIndex] ?? activeAds[0];

  // Stagger initial appearance so rotators don't all change at the same time
  useEffect(() => {
    const offset = (startIndex % (activeAds.length || 1)) * 3000 + Math.random() * 2000;
    const t = setTimeout(() => setReady(true), offset);
    return () => clearTimeout(t);
  }, [startIndex, activeAds.length]);

  // Rotation timer
  useEffect(() => {
    if (!ready || activeAds.length <= 1) return;
    const duration = (currentAd?.display_duration || DEFAULT_DURATION) * 1000;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeAds.length);
        setVisible(true);
      }, FADE_MS);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentIndex, ready, activeAds.length, currentAd]);

  const handleDismiss = useCallback(() => {
    if (currentAd) dismiss(currentAd.id);
    setDismissed(true);
  }, [currentAd, dismiss]);

  // Dismissed entirely
  if (dismissed) return null;

  // Not ready yet (stagger delay) — show empty placeholder briefly
  if (!ready && activeAds.length > 0) {
    return (
      <div
        className={`flex items-center justify-center border-2 border-dashed border-[#d4cfc7] rounded-sm bg-[#f0efed] ${sizeStyles[size]} ${className}`}
        aria-label="Cargando aviso…"
      />
    );
  }

  // No ads or all dismissed — show placeholder
  if (activeAds.length === 0) {
    return (
      <div
        className={`flex items-center justify-center border-2 border-dashed border-[#d4cfc7] rounded-sm bg-[#f0efed] ${sizeStyles[size]} ${className}`}
        aria-label="Espacio publicitario"
      >
        <div className="text-center">
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

  // Single ad — no rotation needed
  if (activeAds.length === 1) {
    return <SingleAd ad={activeAds[0]} size={size} className={className} />;
  }

  // Multiple ads — rotating
  const mobileSrc = currentAd.mobile_image_url || currentAd.image_url;

  const inner = (
    <div
      className={`relative overflow-hidden rounded-sm ${sizeStyles[size]} ${className} group/ad`}
      style={{ transition: `opacity ${FADE_MS}ms ease-in-out`, opacity: visible ? 1 : 0 }}
    >
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSrc ?? undefined} />
        <img
          src={currentAd.image_url!}
          alt={currentAd.title || "Aviso publicitario"}
          className="w-full h-full object-cover"
        />
      </picture>
      <button
        onClick={handleDismiss}
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-xs opacity-100 md:opacity-0 md:group-hover/ad:opacity-100 transition-opacity"
        aria-label="Ocultar aviso"
      >
        &times;
      </button>
    </div>
  );

  if (currentAd.link_url) {
    return (
      <Link href={currentAd.link_url} target="_blank" rel="noopener noreferrer">
        {inner}
      </Link>
    );
  }
  return inner;
}

function SingleAd({
  ad,
  size,
  className,
}: {
  ad: Ad;
  size: string;
  className: string;
}) {
  const dismissedIds = useAdStore((s) => s.dismissedIds);
  const dismiss = useAdStore((s) => s.dismiss);

  const handleDismiss = useCallback(() => {
    dismiss(ad.id);
  }, [ad.id, dismiss]);

  if (dismissedIds.includes(ad.id)) return null;

  const mobileSrc = ad.mobile_image_url || ad.image_url;

  const inner = (
    <div className={`relative overflow-hidden rounded-sm ${sizeStyles[size]} ${className} group/ad`}>
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSrc ?? undefined} />
        <img
          src={ad.image_url!}
          alt={ad.title || "Aviso publicitario"}
          className="w-full h-full object-cover"
        />
      </picture>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white text-xs opacity-100 md:opacity-0 md:group-hover/ad:opacity-100 transition-opacity"
        aria-label="Ocultar aviso"
      >
        &times;
      </button>
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