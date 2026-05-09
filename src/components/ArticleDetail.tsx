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
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
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
    .split(/\n{2,}|(?<=\.)\s{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 10);
  return paragraphs;
}

/** Pick the best sentence as the pull-quote highlight */
function extractHighlight(paragraphs: string[]): { text: string; insertAfter: number } | null {
  if (paragraphs.length === 0) return null;

  // Look at paragraphs after the intro (skip first), pick the longest sentence
  const startIdx = paragraphs.length > 2 ? 1 : 0;
  const candidates = paragraphs.slice(startIdx, startIdx + 3);
  let best = "";
  let bestParaOffset = 0;

  candidates.forEach((para, offset) => {
    const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length > best.length && trimmed.length > 30) {
        best = trimmed;
        bestParaOffset = offset;
      }
    }
  });

  if (!best) return null;
  return { text: best, insertAfter: startIdx + bestParaOffset };
}

function BodyWithHighlight({ body, color }: { body: string; color: string }) {
  const paragraphs = parseBody(body);
  const highlight = extractHighlight(paragraphs);
  const insertAfter = highlight?.insertAfter ?? -1;

  if (paragraphs.length === 0) return null;

  return (
    <div className="mt-8 article-body text-foreground/90 space-y-4">
      {paragraphs.map((paragraph, i) => (
        <div key={i}>
          <p className="">
            {paragraph}
          </p>
          {i === insertAfter && highlight && (
            <blockquote
              className="my-8 pl-6 border-l-4 italic"
              style={{ borderColor: color, color }}
            >
              <p className="text-xl md:text-2xl font-[family-name:var(--font-heading)] leading-snug">
                &ldquo;{highlight.text}&rdquo;
              </p>
            </blockquote>
          )}
        </div>
      ))}
    </div>
  );
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
            <div className="mt-6 w-full h-64 md:h-96 overflow-hidden rounded-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.imageAlt}
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
                loading="eager"
              />
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

          {/* Leaderboard ad between image and body */}
          <div className="mt-6">
            <AdSlot size="leaderboard" ad={leaderboardAd} />
          </div>

          {/* Font size control */}
          <div className="flex justify-end mt-4 mb-2">
            <FontSizeControl fontSize={fontSize} setFontSize={setFontSize} />
          </div>

          {/* Body */}
          <div style={{
            '--article-font-size': fontSize === -1 ? '0.875rem' : fontSize === 1 ? '1.125rem' : fontSize === 2 ? '1.25rem' : '1.0625rem',
            '--article-line-height': fontSize >= 1 ? '1.9' : '1.8',
          } as React.CSSProperties}>
          {article.body ? (
            <BodyWithHighlight
              body={article.body}
              color={cfg.color}
            />
          ) : article.excerpt ? (
            <div className="mt-8 article-body">
              <p>{article.excerpt}</p>
              <blockquote
                className="my-8 pl-6 border-l-4 italic"
                style={{ borderColor: cfg.color, color: cfg.color }}
              >
                <p className="text-xl md:text-2xl font-[family-name:var(--font-heading)] leading-snug">
                  &ldquo;{article.excerpt.length > 80 ? article.excerpt.slice(0, article.excerpt.lastIndexOf(".", 80) + 1) || article.excerpt.slice(0, 80) + "…" : article.excerpt}&rdquo;
                </p>
              </blockquote>
            </div>
          ) : null}
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