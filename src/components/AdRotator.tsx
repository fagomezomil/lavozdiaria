"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Ad } from "@/lib/types";

interface AdRotatorProps {
  ads: Ad[];
  size: "leaderboard" | "rectangle" | "sidebar" | "infeed" | "sticky_footer";
  className?: string;
}

// Relaciones de aspecto estándar — mismas en desktop y mobile.
// Leader / sticky_footer: 8:1 (desktop 1280x160, mobile 320x40).
// Rectangle / sidebar / infeed: 8:5 (desktop 400x250, mobile 320x200).
// El cliente sube UNA sola imagen con la proporción del banner; se escala sin recortes.
const sizeStyles: Record<string, string> = {
  leaderboard: "w-full aspect-[8/1]",
  rectangle: "w-full aspect-[8/5]",
  sidebar: "w-full aspect-[8/5]",
  infeed: "w-full aspect-[8/5]",
  sticky_footer: "w-full aspect-[8/1]",
};

const DEFAULT_DURATION = 15;
const FADE_MS = 300;

function Placeholder({ className, label }: { className: string; label: string }) {
  return (
    <div
      className={`flex items-center justify-center border-2 border-dashed border-[#d4cfc7] rounded-sm bg-[#f0efed] ${className}`}
      aria-label={label}
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

export default function AdRotator({ ads, size, className = "" }: AdRotatorProps) {
  // Deterministic initial state to avoid hydration mismatch (server vs client Math.random()).
  // Randomize after mount via useEffect.
  const [startIndex, setStartIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  const activeAds = useMemo(
    () => ads.filter((ad) => ad.image_url),
    [ads]
  );

  const currentAd = activeAds[currentIndex] ?? activeAds[0];

  // Randomize initial ad and stagger seed once mounted (client only)
  useEffect(() => {
    if (activeAds.length === 0) return;
    setStartIndex(Math.floor(Math.random() * 1000));
    setCurrentIndex(Math.floor(Math.random() * activeAds.length));
    setReady(true);
  }, [activeAds.length]);

  // Rotation timer — stagger across rotators so they don't all change at the same moment.
  useEffect(() => {
    if (!ready || activeAds.length <= 1) return;
    const offset = (startIndex % activeAds.length) * 1500 + Math.random() * 1000;
    const duration = (currentAd?.display_duration || DEFAULT_DURATION) * 1000 + offset;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeAds.length);
        setVisible(true);
      }, FADE_MS);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentIndex, ready, activeAds.length, currentAd, startIndex]);

  const containerClass = `relative overflow-hidden rounded-sm bg-paper ${sizeStyles[size]} ${className}`;

  // No ads — show placeholder
  if (activeAds.length === 0) {
    return <Placeholder className={containerClass} label="Espacio publicitario" />;
  }

  // Single ad — no rotation needed
  if (activeAds.length === 1) {
    return <SingleAd ad={activeAds[0]} size={size} className={className} />;
  }

  // Multiple ads — rotating
  const mobileSrc = currentAd.mobile_image_url || currentAd.image_url;

  const inner = (
    <div
      className={`${containerClass} group/ad`}
      style={{ transition: `opacity ${FADE_MS}ms ease-in-out`, opacity: visible ? 1 : 0 }}
    >
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSrc ?? undefined} />
        <img
          src={currentAd.image_url!}
          alt={currentAd.title || "Aviso publicitario"}
          className="w-full h-full object-contain"
        />
      </picture>
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
  const mobileSrc = ad.mobile_image_url || ad.image_url;

  const inner = (
    <div className={`relative overflow-hidden rounded-sm bg-paper ${sizeStyles[size]} ${className} group/ad`}>
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSrc ?? undefined} />
        <img
          src={ad.image_url!}
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