"use client";

import Link from "next/link";
import { useState } from "react";
import { Article, sectionConfig } from "@/lib/types";

interface ArticleCardProps {
  article: Article;
  variant?: "hero" | "standard" | "compact";
  commentCount?: number;
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
      <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden" style={{ borderTop: `4px solid ${sectionColor}` }}>
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
}: ArticleCardProps) {
  const cfg = sectionConfig[article.section];
  const byline = article.author ?? article.publisher;

  if (variant === "hero") {
    return (
      <article className="group">
        <Link href={`/${article.section}/${article.id}`}>
          {article.imageUrl ? (
            <NewsImage src={article.imageUrl} alt={article.imageAlt} sectionColor={cfg.color} variant="hero" />
          ) : (
            <div
              className="border-t-4 pt-3"
              style={{ borderTopColor: cfg.color }}
            >
              <span
                className="text-xs font-bold tracking-widest uppercase"
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

  if (variant === "compact") {
    return (
      <article className="group py-3 border-b border-rule last:border-0">
        <Link href={`/${article.section}/${article.id}`} className="flex gap-3">
          <NewsImage
            src={article.imageUrl || ""}
            alt={article.imageAlt}
            sectionColor={cfg.color}
            variant="compact"
          />
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

  // standard
  return (
    <article className="group bg-paper border border-border transition-shadow duration-200 hover:shadow-lg">
      <Link href={`/${article.section}/${article.id}`}>
        <div
          className="h-44 flex items-center justify-center relative overflow-hidden"
          style={{ borderTop: `3px solid ${cfg.color}` }}
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
          <span
            className="absolute top-3 left-3 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 text-white z-20"
            style={{ backgroundColor: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold leading-snug font-[family-name:var(--font-heading)] group-hover:underline decoration-1 line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm text-muted line-clamp-3">
              {article.excerpt}
            </p>
          )}
          <div className="mt-3 text-xs text-muted">
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