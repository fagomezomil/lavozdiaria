"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { Article } from "@/lib/types";
import { sectionConfig } from "@/lib/types";

interface HeroEditorialProps {
  articles: Article[];
}

export default function HeroEditorial({ articles }: HeroEditorialProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const advance = useCallback(() => {
    setActiveIndex((i) => (i + 1) % articles.length);
  }, [articles.length]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (articles.length <= 1) return;
    const timer = setInterval(advance, 5000);
    return () => clearInterval(timer);
  }, [advance, articles.length]);

  if (articles.length === 0) return null;

  const lead = articles[activeIndex];
  const leadCfg = sectionConfig[lead.section as keyof typeof sectionConfig];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lead story — 2/3 width, comic panel */}
      <Link
        href={`/${lead.section}/${lead.id}`}
        className="lg:col-span-2 group relative overflow-hidden bg-ink min-h-[260px] md:min-h-[440px] border-ink-3 shadow-hard"
      >
        {lead.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={lead.id}
            src={lead.imageUrl}
            alt={lead.imageAlt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            key={lead.id}
            className="w-full h-full flex items-center justify-center halftone"
            style={{
              background: leadCfg
                ? `linear-gradient(135deg, ${leadCfg.color}30, #0a0a0a 80%)`
                : "linear-gradient(135deg, #f9731630, #0a0a0a 80%)",
            }}
          >
            <span className="text-8xl font-[family-name:var(--font-heading)] opacity-30 text-white uppercase">LV</span>
          </div>
        )}

        {/* Halftone + charcoal overlay — comic noir ink */}
        <div className="absolute inset-0 halftone-light opacity-60" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 45%, rgba(10,10,10,0.1) 100%)" }} />
        {/* Naranja edge tint */}
        <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ background: "radial-gradient(ellipse at bottom right, var(--color-brand), transparent 55%)" }} />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          {leadCfg && (
            <span
              className="stamp text-[11px] md:text-xs"
              style={{ color: leadCfg.color, borderColor: leadCfg.color }}
            >
              {leadCfg.label}
            </span>
          )}
          <h2 className="display text-2xl md:text-4xl lg:text-5xl text-white leading-[1.05] line-clamp-2 md:line-clamp-3 mt-3">
            {lead.title}
          </h2>
          {lead.excerpt && (
            <p className="mt-3 text-sm md:text-base text-white/75 line-clamp-2 hidden md:block font-[family-name:var(--font-body)] font-medium">
              {lead.excerpt}
            </p>
          )}
          {((lead.author ?? lead.publisher) || lead.date) && (
            <p className="mt-3 text-xs text-white/60 tracking-wide uppercase font-[family-name:var(--font-heading)]">
              {(lead.author ?? lead.publisher) && <span>{lead.author ?? lead.publisher}</span>}
              {(lead.author ?? lead.publisher) && lead.date && <span> · </span>}
              {lead.date && <span>{lead.date}</span>}
            </p>
          )}
        </div>
      </Link>

      {/* Secondary stories — 1/3 width (desktop) */}
      <aside className="hidden lg:flex flex-col">
        <h2 className="text-base tracking-widest uppercase text-ink mb-4 font-bold border-b-[3px] border-ink pb-2 font-[family-name:var(--font-heading)]">
          Destacadas
        </h2>
        <div className="flex flex-col divide-y-2 divide-ink">
          {articles.map((a, i) => {
            const aCfg = sectionConfig[a.section as keyof typeof sectionConfig];
            const isActive = i === activeIndex;
            return (
              <Link
                key={a.id}
                href={`/${a.section}/${a.id}`}
                className="group py-4 first:pt-0 flex gap-4 hover:bg-brand/10 transition-colors -mx-2 px-2"
                onMouseEnter={() => setActiveIndex(i)}
              >
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.imageUrl}
                    alt={a.imageAlt}
                    className="w-24 h-20 object-cover shrink-0 border-2 border-ink transition-all duration-300"
                    style={{
                      opacity: isActive ? 1 : 0.65,
                    }}
                  />
                ) : (
                  <div
                    className="w-24 h-20 shrink-0 flex items-center justify-center border-2 border-ink transition-all duration-300"
                    style={{
                      background: aCfg ? `linear-gradient(135deg, ${aCfg.color}30, ${aCfg.color}08)` : undefined,
                      opacity: isActive ? 1 : 0.65,
                    }}
                  >
                    <span className="text-xl font-[family-name:var(--font-heading)] opacity-30" style={{ color: aCfg?.color }}>
                      LV
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-[11px] font-bold tracking-widest uppercase transition-colors duration-300 font-[family-name:var(--font-heading)]"
                    style={{ color: isActive ? aCfg?.color : undefined }}
                  >
                    {aCfg?.label}
                  </span>
                  <h3
                    className={`display text-base leading-tight line-clamp-2 mt-1 group-hover:text-brand transition-colors duration-300 ${isActive ? "text-ink" : "text-muted"}`}
                  >
                    {a.title}
                  </h3>
                  {((a.author ?? a.publisher) || a.date) && (
                    <p className="text-xs text-muted mt-1.5 uppercase tracking-wide font-[family-name:var(--font-heading)]">
                      {(a.author ?? a.publisher) && <span>{a.author ?? a.publisher}</span>}
                      {(a.author ?? a.publisher) && a.date && <span> · </span>}
                      {a.date && <span>{a.date}</span>}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile: horizontal scroll for secondary stories */}
      <div className="flex lg:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {articles.map((a, i) => {
          const aCfg = sectionConfig[a.section as keyof typeof sectionConfig];
          return (
            <Link
              key={a.id}
              href={`/${a.section}/${a.id}`}
              className="shrink-0 w-[200px] snap-start group"
            >
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.imageUrl}
                  alt={a.imageAlt}
                  className="w-full h-28 object-cover border-2 border-ink shadow-hard-sm"
                  style={{ borderTopColor: aCfg?.color }}
                />
              ) : (
                <div
                  className="w-full h-28 flex items-center justify-center border-2 border-ink"
                  style={{
                    borderTopColor: aCfg?.color,
                    background: aCfg ? `linear-gradient(135deg, ${aCfg.color}20, ${aCfg.color}08)` : undefined,
                  }}
                >
                  <span className="text-xl font-[family-name:var(--font-heading)] opacity-20" style={{ color: aCfg?.color }}>LV</span>
                </div>
              )}
              <span
                className="text-[11px] font-bold tracking-widest uppercase mt-1.5 block font-[family-name:var(--font-heading)]"
                style={{ color: aCfg?.color }}
              >
                {aCfg?.label}
              </span>
              <h3 className="display text-base leading-tight line-clamp-2 mt-0.5">
                {a.title}
              </h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}