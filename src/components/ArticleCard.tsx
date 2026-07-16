"use client";

import Link from "next/link";
import { useState } from "react";
import { Article, sectionConfig } from "@/lib/types";

interface ArticleCardProps {
  article: Article;
  variant?: "hero" | "featured" | "urgente" | "standard" | "compact";
  commentCount?: number;
  sponsored?: boolean;
}

function NewsImage({
  src,
  alt,
  sectionColor,
  variant = "standard",
}: {
  src: string;
  alt: string;
  sectionColor: string;
  variant?: "hero" | "standard" | "compact";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (variant === "hero") return null;
    if (variant === "compact") {
      return (
        <div
          className="w-16 h-16 shrink-0 flex items-center justify-center border-2 border-ink"
          style={{ background: `linear-gradient(135deg, ${sectionColor}30, ${sectionColor}08)` }}
        >
          <span className="text-lg font-[family-name:var(--font-heading)] opacity-30" style={{ color: sectionColor }}>
            LV
          </span>
        </div>
      );
    }
    return (
      <div
        className="absolute inset-0 flex items-center justify-center halftone"
        style={{ background: `linear-gradient(135deg, ${sectionColor}20, #0a0a0a 90%)` }}
      >
        <span className="text-5xl font-[family-name:var(--font-heading)] opacity-20 text-white" style={{ color: sectionColor }}>
          LV
        </span>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden" style={{ borderTop: `3px solid ${sectionColor}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          onError={() => setFailed(true)}
          loading="eager"
        />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="relative w-16 h-16 shrink-0 overflow-hidden border-2 border-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // standard
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </>
  );
}

export default function ArticleCard({
  article,
  variant = "standard",
  commentCount,
  sponsored = false,
}: ArticleCardProps) {
  const cfg = sectionConfig[article.section];
  const byline = article.author ?? article.publisher;
  const href = sponsored ? `/patrocinado/${article.id}` : `/${article.section}/${article.id}`;

  if (variant === "hero") {
    return (
      <article className="group">
        <Link href={href}>
          {article.imageUrl ? (
            <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="hero" />
          ) : (
            <div
              className="border-t-[3px] pt-3"
              style={{ borderTopColor: cfg.color }}
            >
              <span
                className="text-[11px] font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          )}
          <h2 className="display mt-2 text-2xl md:text-3xl leading-[1.05] group-hover:text-brand transition-colors">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="mt-3 text-foreground/80 leading-relaxed font-[family-name:var(--font-body)]">
              {article.excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted uppercase tracking-wide font-[family-name:var(--font-heading)]">
            {byline && (
              <>
                <span className="font-semibold text-foreground/70">{byline}</span>
                <span>·</span>
              </>
            )}
            <span>{article.date}</span>
            {commentCount !== undefined && commentCount > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H6l-3 3V4z" />
                  </svg>
                  {commentCount}
                </span>
              </>
            )}
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="group bg-paper border-ink-2 shadow-hard h-full">
        <Link href={href} className="flex flex-col sm:flex-row h-full">
          <div
            className="sm:w-1/2 h-36 sm:h-auto flex items-center justify-center relative overflow-hidden"
            style={{ borderTop: `3px solid ${cfg.color}` }}
          >
            {article.imageUrl ? (
              <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="standard" />
            ) : (
              <div
                className="absolute inset-0 halftone"
                style={{ background: `linear-gradient(135deg, ${cfg.color}20, #0a0a0a 90%)` }}
              />
            )}
            {!article.imageUrl && (
              <span className="text-5xl font-[family-name:var(--font-heading)] opacity-30 text-white relative z-10 uppercase">LV</span>
            )}
          </div>
          <div className="sm:w-1/2 p-3 sm:p-5 flex flex-col justify-center">
            <span
              className="text-[11px] font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
            <h2 className="display mt-1 text-lg sm:text-xl md:text-2xl leading-tight line-clamp-2 sm:line-clamp-3 group-hover:text-brand transition-colors">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="mt-2 text-sm text-muted line-clamp-2 sm:line-clamp-3 font-[family-name:var(--font-body)]">
                {article.excerpt}
              </p>
            )}
            <div className="mt-3 text-xs text-muted uppercase tracking-wide font-[family-name:var(--font-heading)]">
              {byline && <>{byline} · </>}
              {article.date}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "urgente") {
    return (
      <article className="group">
        <Link
          href={href}
          className="block relative w-full min-h-[280px] md:min-h-[420px] lg:min-h-[550px] overflow-hidden bg-ink border-ink-3 shadow-hard-lg"
        >
          {article.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={article.imageUrl}
              alt={article.imageAlt}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="absolute inset-0 halftone" />
          )}
          {/* Halftone + charcoal overlay — comic noir ink */}
          <div className="absolute inset-0 halftone-light opacity-60" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 45%, rgba(10,10,10,0.15) 100%)" }} />
          {/* Burnt-sienna scan line — animated pulse at top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-urgente animate-urgente-pulse" />
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 lg:p-10">
            {/* Urgente starburst badge + section stamp */}
            <div className="flex items-center gap-4 mb-4">
              <span className="starburst inline-flex items-center justify-center w-16 h-16 bg-urgente text-white text-[10px] font-black tracking-widest uppercase font-[family-name:var(--font-heading)] shrink-0">
                URGENTE
              </span>
              <span
                className="text-[11px] font-bold tracking-widest uppercase text-white/70 font-[family-name:var(--font-heading)]"
              >
                {cfg.label}
              </span>
            </div>
            {/* Headline — Oswald display */}
            <h2 className="display text-2xl md:text-4xl lg:text-6xl leading-[1.0] text-white group-hover:text-brand transition-colors">
              {article.title}
            </h2>
            {/* Excerpt */}
            {article.excerpt && (
              <p className="mt-4 text-base md:text-lg text-white/80 leading-relaxed max-w-3xl line-clamp-2 font-[family-name:var(--font-body)] font-medium">
                {article.excerpt}
              </p>
            )}
            {/* Byline */}
            <div className="mt-4 text-xs text-white/60 tracking-wide uppercase font-[family-name:var(--font-heading)]">
              {byline && <>{byline} · </>}
              {article.date}
            </div>
          </div>
          {/* Bottom urgente rule */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-urgente" />
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group py-3 border-b-2 border-ink last:border-0">
        <Link href={href} className="flex gap-3">
          {article.imageUrl && (
            <NewsImage
              src={article.imageUrl}
              alt={article.imageAlt}
              sectionColor={cfg.color}
              variant="compact"
            />
          )}
          {!article.imageUrl && (
            <div
              className="w-16 h-16 shrink-0 flex items-center justify-center border-2 border-ink"
              style={{ background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}08)` }}
            >
              <span className="text-lg font-[family-name:var(--font-heading)] opacity-30" style={{ color: cfg.color }}>
                LV
              </span>
            </div>
          )}
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
            <h3 className="display mt-0.5 text-sm leading-snug group-hover:text-brand line-clamp-2 transition-colors">
              {article.title}
            </h3>
            <span className="text-xs text-muted uppercase tracking-wide font-[family-name:var(--font-heading)]">{article.date}</span>
          </div>
        </Link>
      </article>
    );
  }

  // standard
  if (sponsored) {
    return (
      <article className="group bg-paper border-ink-2 shadow-hard h-full">
        <Link href={href} className="flex flex-col h-full">
          <div
            className="h-36 sm:h-44 flex items-center justify-center relative overflow-hidden"
            style={{ borderTop: `3px solid ${cfg.color}` }}
          >
            {article.imageUrl ? (
              <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="standard" />
            ) : (
              <div
                className="absolute inset-0 halftone"
                style={{ background: `linear-gradient(135deg, ${cfg.color}15, #0a0a0a 90%)` }}
              />
            )}
            {!article.imageUrl && (
              <span className="text-5xl font-[family-name:var(--font-heading)] opacity-30 text-white relative z-10 uppercase">LV</span>
            )}
            <span className="absolute top-3 right-3 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#16a34a] text-white z-20 font-[family-name:var(--font-heading)] border-2 border-ink">
              Contenido patrocinado
            </span>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="display text-lg leading-snug group-hover:text-brand line-clamp-2 transition-colors">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="mt-2 text-sm text-muted line-clamp-3 font-[family-name:var(--font-body)]">
                {article.excerpt}
              </p>
            )}
            <div className="mt-auto pt-3 text-xs text-muted uppercase tracking-wide font-[family-name:var(--font-heading)]">
              {byline && <>{byline} · </>}
              {article.date}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // standard
  return (
    <article className="group bg-paper border-ink-2 shadow-hard h-full">
      <Link href={href} className="flex flex-col h-full">
        <div
          className="h-36 sm:h-44 flex items-center justify-center relative overflow-hidden"
          style={{ borderTop: `3px solid ${cfg.color}` }}
        >
          {article.imageUrl ? (
            <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="standard" />
          ) : (
            <div
              className="absolute inset-0 halftone"
              style={{ background: `linear-gradient(135deg, ${cfg.color}15, #0a0a0a 90%)` }}
            />
          )}
          {!article.imageUrl && (
            <span className="text-5xl font-[family-name:var(--font-heading)] opacity-30 text-white relative z-10 uppercase">LV</span>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <span
            className="text-[11px] font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
          <h3 className="display mt-0.5 text-lg leading-snug group-hover:text-brand line-clamp-2 transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm text-muted line-clamp-3 font-[family-name:var(--font-body)]">
              {article.excerpt}
            </p>
          )}
          <div className="mt-auto pt-3 text-xs text-muted uppercase tracking-wide font-[family-name:var(--font-heading)]">
            {byline && <>{byline} · </>}
            {article.date}
            {commentCount !== undefined && commentCount > 0 && (
              <> · <span className="inline-flex items-center gap-0.5"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H6l-3 3V4z" /></svg>{commentCount}</span></>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}