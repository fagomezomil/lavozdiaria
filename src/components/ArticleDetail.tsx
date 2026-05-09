"use client";

import Link from "next/link";
import { useState } from "react";
import { Article, Ad, sectionConfig } from "@/lib/types";
import AdSlot from "@/components/AdSlot";
import AnimateIn from "@/components/animate/AnimateIn";
import FontSizeControl from "@/components/FontSizeControl";

/** Strip HTML tags and decode common entities */
function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .trim();
}

/** Parse body (HTML or plain text) into clean paragraphs */
function parseBody(raw: string): string[] {
  const text = stripHtml(raw);
  const paragraphs = text
    .split(/\n{1,}/)                    // split on any newline (single or double)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 5);
  return paragraphs;
}

/** Pick the best sentence as the pull-quote highlight */
function extractHighlight(paragraphs: string[]): string | null {
  if (paragraphs.length === 0) return null;

  // Look at paragraphs after the intro (skip first), pick the longest sentence
  const startIdx = paragraphs.length > 2 ? 1 : 0;
  const candidates = paragraphs.slice(startIdx, startIdx + 3);
  let best = "";

  candidates.forEach((para) => {
    const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length > best.length && trimmed.length > 30) {
        best = trimmed;
      }
    }
  });

  return best || null;
}

interface ArticleDetailProps {
  article: Article;
  related: Article[];
  leaderboardAd?: Ad | null;
  sidebarAd?: Ad | null;
}

export default function ArticleDetail({
  article,
  related,
  leaderboardAd,
  sidebarAd,
}: ArticleDetailProps) {
  const cfg = sectionConfig[article.section];
  const byline = article.author ?? article.publisher;
  const [imgFailed, setImgFailed] = useState(false);
  const [fontSize, setFontSize] = useState(0); // -1 smaller, 0 default, 1 larger, 2 extra-large

  // Parse body and extract highlight once
  const rawBody = article.body || "";
  const paragraphs = rawBody ? parseBody(rawBody) : [];
  const highlight = paragraphs.length > 0 ? extractHighlight(paragraphs) : null;

  // Excerpt fallback highlight
  const excerptHighlight = article.excerpt
    ? article.excerpt.length > 80
      ? article.excerpt.slice(0, article.excerpt.lastIndexOf(".", 80) + 1) || article.excerpt.slice(0, 80) + "\u2026"
      : article.excerpt
    : null;

  const displayHighlight = highlight ?? excerptHighlight;

  return (
    <article className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <AnimateIn direction="none" delay={0}>
        <nav className="text-xs text-muted mb-4 flex items-center gap-1">
          <Link href="/" className="hover:text-foreground transition-colors">
            Portada
          </Link>
          <span>/</span>
          <Link
            href={cfg.path}
            className="hover:text-foreground transition-colors"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </Link>
        </nav>
      </AnimateIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Section badge */}
          <AnimateIn direction="left" delay={0.1}>
            <div
              className="border-t-4 pt-3 mb-4"
              style={{ borderTopColor: cfg.color }}
            >
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          </AnimateIn>

          {/* Title */}
          <AnimateIn direction="up" delay={0.15}>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight font-[family-name:var(--font-heading)]">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="mt-2 text-lg text-muted italic">{article.subtitle}</p>
            )}
          </AnimateIn>

          {/* Byline */}
          <AnimateIn direction="up" delay={0.2}>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted border-b border-rule pb-4 flex-wrap">
              {byline && (
                <span className="font-semibold text-foreground/70">{byline}</span>
              )}
              {byline && <span>·</span>}
              <span>{article.date}</span>
              {article.originalUrl && (
                <>
                  <span>·</span>
                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors underline"
                    style={{ color: cfg.color }}
                  >
                    Fuente original
                  </a>
                </>
              )}
            </div>
          </AnimateIn>

          {/* Image */}
          <AnimateIn direction="up" delay={0.25}>
          {article.imageUrl && !imgFailed ? (
            <div className="mt-6">
              <div className="w-full h-64 md:h-96 overflow-hidden rounded-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.imageUrl}
                  alt={article.imageAlt}
                  className="w-full h-full object-cover"
                  onError={() => setImgFailed(true)}
                  loading="eager"
                />
              </div>
              {article.imageAlt && (
                <p className="mt-2 text-xs text-muted italic">{article.imageAlt}</p>
              )}
            </div>
          ) : (
            <div
              className="mt-6 h-64 md:h-80 flex items-center justify-center rounded-sm"
              style={{
                background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)`,
              }}
            >
              <span
                className="text-7xl font-[family-name:var(--font-heading)] opacity-15"
                style={{ color: cfg.color }}
              >
                LV
              </span>
            </div>
          )}
          </AnimateIn>

          {/* Destacado (pull quote) — below the photo */}
          {displayHighlight && (
            <AnimateIn direction="up" delay={0.3}>
              <blockquote
                className="mt-6 pl-6 border-l-4 italic"
                style={{ borderColor: cfg.color, color: cfg.color }}
              >
                <p className="text-xl md:text-2xl font-[family-name:var(--font-heading)] leading-snug">
                  &ldquo;{displayHighlight}&rdquo;
                </p>
              </blockquote>
            </AnimateIn>
          )}

          {/* Font size control */}
          <div className="flex justify-end mt-6 mb-2">
            <FontSizeControl fontSize={fontSize} setFontSize={setFontSize} />
          </div>

          {/* Body text */}
          <div style={{
            '--article-font-size': fontSize === -1 ? '0.875rem' : fontSize === 1 ? '1.125rem' : fontSize === 2 ? '1.25rem' : '1.0625rem',
            '--article-line-height': fontSize >= 1 ? '1.9' : '1.8',
          } as React.CSSProperties}>
          {paragraphs.length > 0 ? (
            <div className="article-body text-foreground/90">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : article.excerpt ? (
            <div className="mt-4 article-body text-foreground/90">
              <p>{article.excerpt}</p>
            </div>
          ) : null}
          </div>

          {/* Related cards */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2
                className="text-sm font-bold tracking-widest uppercase pb-3 mb-6 border-b-2"
                style={{ borderColor: cfg.color, color: cfg.color }}
              >
                Leé aquí más información
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.slice(0, 3).map((a) => {
                  const rCfg = sectionConfig[a.section];
                  return (
                    <Link key={a.id} href={`/${a.section}/${a.id}`} className="group">
                      <div className="h-40 overflow-hidden rounded-sm relative" style={{ borderTop: `3px solid ${rCfg.color}` }}>
                        {a.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={a.imageUrl}
                            alt={a.imageAlt}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${rCfg.color}20, ${rCfg.color}08)` }}
                          >
                            <span className="text-4xl font-[family-name:var(--font-heading)] opacity-15" style={{ color: rCfg.color }}>
                              LV
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-bold leading-snug font-[family-name:var(--font-heading)] group-hover:underline line-clamp-2">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="mt-1 text-xs text-muted line-clamp-2">
                          {a.excerpt}
                        </p>
                      )}
                      <span className="mt-1.5 text-[10px] text-muted block">
                        {a.date}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaderboard ad — after all content */}
          <div className="mt-10">
            <AdSlot size="leaderboard" ad={leaderboardAd} />
          </div>

          {/* Share / back link */}
          <div className="mt-10 pt-6 border-t-2 border-ink flex items-center justify-between">
            <Link
              href={cfg.path}
              className="text-sm font-semibold hover:underline transition-colors"
              style={{ color: cfg.color }}
            >
              &larr; Más noticias de {cfg.label}
            </Link>
            {article.originalUrl && (
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Ver en fuente original &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Sidebar: related articles */}
        <aside className="lg:col-span-1">
          <AnimateIn direction="right" delay={0.3}>
          <h2 className="text-xs tracking-widest uppercase text-muted mb-3 font-bold border-b-2 border-ink pb-1">
            Más en {cfg.label}
          </h2>
          <div className="space-y-0">
            {related.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/${a.section}/${a.id}`}
                className="block py-3 border-b border-rule last:border-0 group"
              >
                <h3 className="text-sm font-semibold leading-snug font-[family-name:var(--font-heading)] group-hover:underline">
                  {a.title}
                </h3>
                <span className="text-xs text-muted mt-0.5 block">
                  {a.date}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <AdSlot size="sidebar" ad={sidebarAd} />
          </div>
          </AnimateIn>
        </aside>
      </div>
    </article>
  );
}