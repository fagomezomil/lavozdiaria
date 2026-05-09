"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { Article } from "@/lib/types";
import { sectionConfig } from "@/lib/types";

interface HeroSliderProps {
  articles: Article[];
  interval?: number;
}

export default function HeroSlider({ articles, interval = 5000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % articles.length);
  }, [articles.length]);

  const goTo = (index: number) => setCurrent(index);

  // Auto-advance
  useEffect(() => {
    if (paused || articles.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [paused, next, interval, articles.length]);

  if (articles.length === 0) return null;

  const article = articles[current];
  const cfg = sectionConfig[article.section as keyof typeof sectionConfig];

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main slide */}
      <div className="lg:col-span-2 relative overflow-hidden rounded-sm bg-paper min-h-[320px] md:min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={article.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Link href={`/${article.section}/${article.id}`} className="block h-full group">
              {/* Image */}
              {article.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.imageUrl}
                  alt={article.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: cfg
                      ? `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}08)`
                      : "linear-gradient(135deg, #e6394630, #e6394608)",
                  }}
                >
                  <span className="text-8xl font-[family-name:var(--font-heading)] opacity-15" style={{ color: cfg?.color }}>
                    LV
                  </span>
                </div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                {cfg && (
                  <span
                    className="inline-block px-2 py-0.5 text-xs font-bold tracking-widest uppercase rounded-sm mb-2"
                    style={{ backgroundColor: cfg.color, color: "#fff" }}
                  >
                    {cfg.label}
                  </span>
                )}
                <h2 className="text-xl md:text-3xl font-bold text-white leading-tight font-[family-name:var(--font-heading)] line-clamp-3">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="mt-2 text-sm text-white/70 line-clamp-2 hidden md:block">
                    {article.excerpt}
                  </p>
                )}
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        {articles.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 md:bottom-4">
            {articles.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? "bg-white w-5" : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Ir a nota ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Side thumbnails */}
      <aside className="hidden lg:flex flex-col gap-2">
        <h2 className="text-xs tracking-widest uppercase text-muted mb-1 font-bold border-b-2 border-ink pb-1">
          Destacadas
        </h2>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {articles.map((a, i) => {
            const aCfg = sectionConfig[a.section as keyof typeof sectionConfig];
            const isActive = i === current;
            return (
              <button
                key={a.id}
                onClick={() => goTo(i)}
                className={`text-left p-3 rounded-sm transition-all ${
                  isActive
                    ? "bg-[#f0efed] border-l-[3px]"
                    : "hover:bg-[#f8f5f0] border-l-[3px] border-l-transparent"
                }`}
                style={isActive && aCfg ? { borderLeftColor: aCfg.color } : {}}
              >
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: aCfg?.color }}
                >
                  {aCfg?.label}
                </span>
                <p className="text-sm font-semibold leading-snug font-[family-name:var(--font-heading)] line-clamp-2 mt-0.5">
                  {a.title}
                </p>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}