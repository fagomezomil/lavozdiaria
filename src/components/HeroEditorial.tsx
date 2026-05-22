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
      {/* Lead story — 2/3 width */}
      <Link
        href={`/${lead.section}/${lead.id}`}
        className="lg:col-span-2 group relative overflow-hidden rounded-sm bg-paper min-h-[240px] md:min-h-[420px]"
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
            className="w-full h-full flex items-center justify-center"
            style={{
              background: leadCfg
                ? `linear-gradient(135deg, ${leadCfg.color}30, ${leadCfg.color}08)`
                : "linear-gradient(135deg, #e6394630, #e6394608)",
            }}
          >
            <span className="text-8xl font-[family-name:var(--font-heading)] opacity-15" style={{ color: leadCfg?.color }}>
              LV
            </span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          {leadCfg && (
            <span
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: leadCfg.color }}
            >
              {leadCfg.label}
            </span>
          )}
          <h2 className="text-lg md:text-3xl font-bold text-white leading-tight font-[family-name:var(--font-heading)] line-clamp-2 md:line-clamp-3 mt-1">
            {lead.title}
          </h2>
          {lead.excerpt && (
            <p className="mt-2 text-sm text-white/70 line-clamp-2 hidden md:block">
              {lead.excerpt}
            </p>
          )}
          {(lead.author || lead.date) && (
            <p className="mt-2 text-xs text-white/50">
              {lead.author && <span>{lead.author}</span>}
              {lead.author && lead.date && <span> · </span>}
              {lead.date && <span>{lead.date}</span>}
            </p>
          )}
        </div>
      </Link>

      {/* Secondary stories — 1/3 width (desktop) */}
      <aside className="hidden lg:flex flex-col">
        <h2 className="text-sm tracking-widest uppercase text-muted mb-4 font-bold border-b-2 border-ink pb-2">
          Destacadas
        </h2>
        <div className="flex flex-col divide-y divide-rule">
          {articles.map((a, i) => {
            const aCfg = sectionConfig[a.section as keyof typeof sectionConfig];
            const isActive = i === activeIndex;
            return (
              <Link
                key={a.id}
                href={`/${a.section}/${a.id}`}
                className="group py-4 first:pt-0 flex gap-4 hover:bg-cream/50 transition-colors -mx-2 px-2 rounded-sm"
                onMouseEnter={() => setActiveIndex(i)}
              >
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.imageUrl}
                    alt={a.imageAlt}
                    className="w-24 h-20 object-cover rounded-sm shrink-0 border-t-2 transition-all duration-300"
                    style={{
                      borderTopColor: isActive ? aCfg?.color : "transparent",
                      opacity: isActive ? 1 : 0.7,
                    }}
                  />
                ) : (
                  <div
                    className="w-24 h-20 rounded-sm shrink-0 flex items-center justify-center border-t-2 transition-all duration-300"
                    style={{
                      borderTopColor: isActive ? aCfg?.color : "transparent",
                      background: aCfg ? `linear-gradient(135deg, ${aCfg.color}20, ${aCfg.color}08)` : undefined,
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    <span className="text-xl font-[family-name:var(--font-heading)] opacity-20" style={{ color: aCfg?.color }}>
                      LV
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-[11px] font-bold tracking-widest uppercase transition-colors duration-300"
                    style={{ color: isActive ? aCfg?.color : undefined }}
                  >
                    {aCfg?.label}
                  </span>
                  <h3
                    className={`text-[15px] font-semibold leading-snug font-[family-name:var(--font-heading)] line-clamp-2 mt-1 group-hover:underline transition-colors duration-300 ${isActive ? "text-ink" : "text-muted"}`}
                  >
                    {a.title}
                  </h3>
                  {(a.author || a.date) && (
                    <p className="text-xs text-muted mt-1.5">
                      {a.author && <span>{a.author}</span>}
                      {a.author && a.date && <span> · </span>}
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
                  className="w-full h-28 object-cover rounded-sm border-t-2"
                  style={{ borderTopColor: aCfg?.color }}
                />
              ) : (
                <div
                  className="w-full h-28 rounded-sm flex items-center justify-center border-t-2"
                  style={{
                    borderTopColor: aCfg?.color,
                    background: aCfg ? `linear-gradient(135deg, ${aCfg.color}20, ${aCfg.color}08)` : undefined,
                  }}
                >
                  <span className="text-xl font-[family-name:var(--font-heading)] opacity-20" style={{ color: aCfg?.color }}>LV</span>
                </div>
              )}
              <span
                className="text-[11px] font-bold tracking-widest uppercase mt-1.5 block"
                style={{ color: aCfg?.color }}
              >
                {aCfg?.label}
              </span>
              <h3 className="text-[15px] font-semibold leading-snug font-[family-name:var(--font-heading)] line-clamp-2 mt-0.5">
                {a.title}
              </h3>
            </Link>
          );
        })}
      </div>
    </div>
  );
}