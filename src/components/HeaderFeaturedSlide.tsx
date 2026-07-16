"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { sectionConfig } from "@/lib/types";
import type { Article } from "@/lib/types";

interface HeaderFeaturedSlideProps {
  articles: Article[];
  intervalMs?: number;
  title?: string;
}

/**
 * Compact editor-featured slider for the masthead.
 * Comic noir: ink border, hard shadow, halftone, Oswald display headline.
 * Auto-rotates every `intervalMs` (default 4.5s). Pauses on hover.
 */
export default function HeaderFeaturedSlide({
  articles,
  intervalMs = 4500,
}: HeaderFeaturedSlideProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % articles.length);
  }, [articles.length]);

  useEffect(() => {
    if (paused || articles.length <= 1) return;
    const t = setInterval(advance, intervalMs);
    return () => clearInterval(t);
  }, [advance, intervalMs, paused, articles.length]);

  if (articles.length === 0) return null;

  const current = articles[index];
  const cfg = sectionConfig[current.section as keyof typeof sectionConfig];
  const href =
    current.section && current.id
      ? `/${current.section}/${current.id}`
      : "/";

  return (
    <div
      className="hidden lg:block min-w-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      <Link
        href={href}
        className="group block relative bg-admin-bg border-ink-3 shadow-hard p-3 pl-4 overflow-hidden"
      >
        {/* Halftone texture */}
        <div className="absolute inset-0 halftone-light opacity-40 pointer-events-none" />
        {/* Naranja left rail */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand" />

        <div className="relative">
          {cfg && (
            <span
              className="text-[10px] font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
          )}
          <h2 className="display text-base xl:text-lg text-brand leading-tight line-clamp-2 mt-0.5 hover:text-black transition-colors">
            {current.title}
          </h2>
          {current.excerpt && (
            <p className="mt-1 text-xs text-gray-600 line-clamp-1 hidden xl:block font-[family-name:var(--font-body)]">
              {current.excerpt}
            </p>
          )}
        </div>

        {/* Dot indicators */}
        {articles.length > 1 && (
          <div className="relative flex items-center gap-1.5 mt-2.5">
            {articles.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setIndex(i);
                }}
                aria-label={`Ver destacada ${i + 1}`}
                className={`h-1 transition-all ${i === index ? "w-6 bg-brand" : "w-3 bg-white/30 hover:bg-white/60"
                  }`}
              />
            ))}
          </div>
        )}
      </Link>
    </div>
  );
}