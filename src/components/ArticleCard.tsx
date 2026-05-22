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
          className="w-16 h-16 shrink-0 flex items-center justify-center rounded-sm"
          style={{ background: `linear-gradient(135deg, ${sectionColor}20, ${sectionColor}08)` }}
        >
          <span className="text-lg font-[family-name:var(--font-heading)] opacity-20" style={{ color: sectionColor }}>
            LV
          </span>
        </div>
      );
    }
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${sectionColor}20, ${sectionColor}08)` }}
      >
        <span className="text-5xl font-[family-name:var(--font-heading)] opacity-10" style={{ color: sectionColor }}>
          LV
        </span>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden" style={{ borderTop: `2px solid ${sectionColor}` }}>
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
      <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-sm">
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
              className="border-t-2 pt-3"
              style={{ borderTopColor: cfg.color }}
            >
              <span
                className="text-[11px] font-bold tracking-widest uppercase"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          )}
          <h2 className="mt-2 text-2xl md:text-3xl font-bold leading-tight font-[family-name:var(--font-heading)] group-hover:underline decoration-2 underline-offset-4">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="mt-3 text-foreground/80 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
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
      <article className="group bg-paper transition-shadow duration-200 hover:shadow-lg h-full">
        <Link href={href} className="flex flex-col sm:flex-row h-full">
          <div
            className="sm:w-1/2 h-36 sm:h-auto flex items-center justify-center relative overflow-hidden"
            style={{ borderTop: `2px solid ${cfg.color}` }}
          >
            {article.imageUrl ? (
              <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="standard" />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${cfg.color}15, ${cfg.color}08)` }}
              />
            )}
            {!article.imageUrl && (
              <span className="text-5xl font-[family-name:var(--font-heading)] opacity-10 relative z-10" style={{ color: cfg.color }}>
                LV
              </span>
            )}
          </div>
          <div className="sm:w-1/2 p-3 sm:p-5 flex flex-col justify-center">
            <span
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
            <h2 className="mt-1 text-lg sm:text-xl md:text-2xl font-bold leading-tight font-[family-name:var(--font-heading)] group-hover:underline decoration-1 underline-offset-4 line-clamp-2 sm:line-clamp-3">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="mt-2 text-sm text-muted line-clamp-2 sm:line-clamp-3">
                {article.excerpt}
              </p>
            )}
            <div className="mt-3 text-xs text-muted">
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
          className="block relative w-full min-h-[280px] md:min-h-[420px] lg:min-h-[550px] overflow-hidden border-t-4 border-[#c8102e]"
        >
          {article.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={article.imageUrl}
              alt={article.imageAlt}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="absolute inset-0 bg-[#1a1a1a]" />
          )}
          {/* Double gradient: heavy bottom for text, subtle top vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          {/* Red scan line — animated pulse at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#c8102e] animate-urgente-pulse" />
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 lg:p-10">
            {/* Urgente label + section */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase bg-[#c8102e] text-white px-3 py-1">
                URGENTE
              </span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/50">
                {cfg.label}
              </span>
            </div>
            {/* Headline — massive, white, Playfair weight */}
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-black leading-[1.1] tracking-tight text-white font-[family-name:var(--font-heading)] group-hover:underline decoration-2 underline-offset-4 decoration-[#c8102e]">
              {article.title}
            </h2>
            {/* Excerpt — if present */}
            {article.excerpt && (
              <p className="mt-3 text-base md:text-lg text-white/70 leading-relaxed max-w-3xl line-clamp-2">
                {article.excerpt}
              </p>
            )}
            {/* Byline */}
            <div className="mt-4 text-xs text-white/40 tracking-wide">
              {byline && <>{byline} · </>}
              {article.date}
            </div>
          </div>
          {/* Bottom red rule */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#c8102e]" />
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group py-3 border-b border-rule last:border-0">
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
              className="w-16 h-16 shrink-0 flex items-center justify-center rounded-sm"
              style={{ background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)` }}
            >
              <span className="text-lg font-[family-name:var(--font-heading)] opacity-20" style={{ color: cfg.color }}>
                LV
              </span>
            </div>
          )}
          <div className="min-w-0">
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
            <h3 className="mt-0.5 text-sm font-semibold leading-snug font-[family-name:var(--font-heading)] group-hover:underline line-clamp-2">
              {article.title}
            </h3>
            <span className="text-xs text-muted">{article.date}</span>
          </div>
        </Link>
      </article>
    );
  }

  // Sponsored badge component (green, right-aligned)
  const sponsoredBadge = (
    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#10b981]/15 text-[#10b981]">
      Contenido patrocinado
    </span>
  );

  // standard
  if (sponsored) {
    return (
      <article className="group bg-paper transition-shadow duration-200 hover:shadow-lg h-full">
        <Link href={href} className="flex flex-col h-full">
          <div
            className="h-36 sm:h-44 flex items-center justify-center relative overflow-hidden"
            style={{ borderTop: `2px solid ${cfg.color}` }}
          >
            {article.imageUrl ? (
              <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="standard" />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${cfg.color}15, ${cfg.color}08)` }}
              />
            )}
            {!article.imageUrl && (
              <span className="text-5xl font-[family-name:var(--font-heading)] opacity-10 relative z-10" style={{ color: cfg.color }}>
                LV
              </span>
            )}
            <span className="absolute top-3 right-3 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#10b981] text-white z-20">
              Contenido patrocinado
            </span>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-lg font-bold leading-snug font-[family-name:var(--font-heading)] group-hover:underline decoration-1 line-clamp-2">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="mt-2 text-sm text-muted line-clamp-3">
                {article.excerpt}
              </p>
            )}
            <div className="mt-auto pt-3 text-xs text-muted">
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
    <article className="group bg-paper transition-shadow duration-200 hover:shadow-lg h-full">
      <Link href={href} className="flex flex-col h-full">
        <div
          className="h-36 sm:h-44 flex items-center justify-center relative overflow-hidden"
          style={{ borderTop: `2px solid ${cfg.color}` }}
        >
          {article.imageUrl ? (
            <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="standard" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${cfg.color}15, ${cfg.color}08)` }}
            />
          )}
          {!article.imageUrl && (
            <span className="text-5xl font-[family-name:var(--font-heading)] opacity-10 relative z-10" style={{ color: cfg.color }}>
              LV
            </span>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <span
            className="text-[11px] font-bold tracking-widest uppercase"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
          <h3 className="mt-0.5 text-lg font-bold leading-snug font-[family-name:var(--font-heading)] group-hover:underline decoration-1 line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm text-muted line-clamp-3">
              {article.excerpt}
            </p>
          )}
          <div className="mt-auto pt-3 text-xs text-muted">
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