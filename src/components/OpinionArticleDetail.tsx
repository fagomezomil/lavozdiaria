"use client";

import Link from "next/link";
import { useState } from "react";
import type { Article, CustomArticle, Columnist, Ad } from "@/lib/types";
import AnimateIn from "@/components/animate/AnimateIn";
import FontSizeControl from "@/components/FontSizeControl";
import ShareButtons from "@/components/ShareButtons";
import LikeButton from "@/components/LikeButton";
import FavoriteButton from "@/components/FavoriteButton";
import CommentSection from "@/components/CommentSection";
import AdRotator from "@/components/AdRotator";

/** Strip HTML and decode common entities — same logic as ArticleDetail.parseBody. */
function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n").replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n").replace(/<div[^>]*>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n").replace(/<h[1-6][^>]*>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n").replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/blockquote>/gi, "\n\n").replace(/<blockquote[^>]*>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&ldquo;/g, "\u201C").replace(/&rdquo;/g, "\u201D")
    .replace(/&ndash;/g, "\u2013").replace(/&mdash;/g, "\u2014")
    .replace(/&rsquo;/g, "\u2019").replace(/&lsquo;/g, "\u2018")
    .replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .trim();
}

function splitSentences(text: string): string[] {
  const MASK = "\u0000";
  const masked = text.replace(/(\d)\.(?=\d)/g, `$1${MASK}`);
  const parts = masked.split(/([.!?…]+(?:["'”’\u201D\u2019])?)/);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const chunk = ((parts[i] ?? "") + (parts[i + 1] ?? "")).trim();
    if (chunk.length > 0) out.push(chunk.replaceAll(MASK, "."));
  }
  return out;
}

function parseBody(raw: string): string[] {
  const text = stripHtml(raw);
  const chunks = text.split(/\n{2,}/);
  const paragraphs: string[] = [];
  for (const chunk of chunks) {
    const parts = chunk
      .split(/(?<=\.["'”’\u201D\u2019]?)\s{2,}(?=[A-ZÁÉÍÓÚÑ¿¡(])/u)
      .map((p) => p.replace(/[ \t]+/g, " ").replace(/\n/g, " ").trim())
      .filter((p) => p.length > 5);
    paragraphs.push(...parts);
  }
  return paragraphs;
}

function extractHighlight(paragraphs: string[]): string | null {
  if (paragraphs.length === 0) return null;
  const startIdx = paragraphs.length > 2 ? 1 : 0;
  const candidates = paragraphs.slice(startIdx, startIdx + 3);
  let best = "";
  candidates.forEach((para) => {
    for (const s of splitSentences(para)) {
      const trimmed = s.trim();
      if (trimmed.length > best.length && trimmed.length > 30) {
        best = trimmed;
      }
    }
  });
  return best || null;
}

interface OpinionArticleDetailProps {
  article: CustomArticle;
  columnist?: Columnist;
  isCustom?: boolean;
  leaderboardTop?: Ad | null;
  leaderboardBottom?: Ad | null;
  sidebarAds?: Ad[];
  moreOpinion?: Article[];
}

export default function OpinionArticleDetail({
  article,
  columnist,
  isCustom = true,
  leaderboardTop,
  leaderboardBottom,
  sidebarAds = [],
  moreOpinion = [],
}: OpinionArticleDetailProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const name = columnist?.name ?? article.author ?? "Redacción";
  const photoUrl = columnist?.photoUrl;
  const volanta = article.volanta || "Opinión";

  const paragraphs = article.body ? parseBody(article.body) : [];
  const highlight = paragraphs.length > 0 ? extractHighlight(paragraphs) : null;

  // Insert pull quote after the 2nd paragraph (if there's a highlight and 3+ paragraphs)
  const showPullQuoteAfter = paragraphs.length >= 3 ? 1 : -1;

  const commentsEnabled =
    "comments_enabled" in article ? (article as CustomArticle).comments_enabled !== false : true;

  return (
    <article className="max-w-7xl mx-auto px-4 py-8">
      {/* Leaderboard top — full width 7xl */}
      {leaderboardTop && (
        <div className="mb-6">
          <AdRotator ads={[leaderboardTop]} size="leaderboard" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Contenido — 3 cols, ocupa todo el ancho */}
        <div className="lg:col-span-3">
      {/* Breadcrumb */}
      <AnimateIn direction="none" delay={0}>
        <nav className="text-xs text-muted mb-6 flex items-center gap-1">
          <Link href="/" className="hover:text-foreground transition-colors">Portada</Link>
          <span>/</span>
          <Link
            href="/opinion"
            className="hover:text-foreground transition-colors text-opinion"
          >
            Opinión
          </Link>
        </nav>
      </AnimateIn>

      {/* Header — columnist-forward, byline above the title (op-ed convention) */}
      <AnimateIn direction="up" delay={0.05}>
        <header className="mb-8">
          {/* Volanta — kicker */}
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-opinion mb-4 font-[family-name:var(--font-heading)]">
            {volanta}
          </p>

          {/* Columnist byline — portrait + name, ABOVE the title (op-ed signature) */}
          <div className="flex items-center gap-4 mb-5">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                className="w-14 h-14 rounded-full object-cover stamp-opinion"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-opinion/10 flex items-center justify-center text-xl font-bold text-opinion stamp-opinion">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5 font-[family-name:var(--font-heading)]">
                Columna de
              </p>
              <p className="text-lg font-bold text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide leading-tight truncate">
                {name}
              </p>
              {columnist?.bio && (
                <p className="text-xs text-muted italic line-clamp-1 mt-0.5">{columnist.bio}</p>
              )}
            </div>
          </div>

          {/* Title — Oswald, NOT uppercase (opinion titles are proper headlines, not labels) */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] font-[family-name:var(--font-heading)] tracking-tight"
              style={{ textTransform: "none" }}>
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="mt-3 text-lg md:text-xl text-muted italic font-[family-name:var(--font-body)]">
              {article.subtitle}
            </p>
          )}

          {/* Meta row — date, share, like, favorite */}
          <div className="mt-6 pt-4 border-b border-rule-opinion pb-4 flex items-center gap-4 flex-wrap text-sm text-muted">
            <span className="font-semibold text-foreground/70">{article.date}</span>
            <div className="flex items-center gap-3 ml-auto">
              <ShareButtons title={article.title} url={`/opinion/${article.id}`} />
              <LikeButton articleId={article.id} isCustom={isCustom} />
              <FavoriteButton articleId={article.id} isCustom={isCustom} />
            </div>
          </div>
        </header>
      </AnimateIn>

      {/* Body — opinion-body, drop cap on first paragraph, pull quote after 2nd */}
      <AnimateIn direction="up" delay={0.1}>
        <div className="opinion-body">
          {paragraphs.length === 0 && article.excerpt && (
            <p className="text-lg italic text-muted">{article.excerpt}</p>
          )}
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? "drop-cap" : undefined}>
              {p}
            </p>
          ))}

          {/* Pull quote — inserted after the 2nd paragraph when there's a highlight */}
          {highlight && showPullQuoteAfter >= 0 && (
            <blockquote className="pull-quote-opinion my-10">
              {highlight}
            </blockquote>
          )}

          {/* Optional inline figure — if the article has an image, show it small with caption.
              NOT a full-width hero — opinion is voice, not image. */}
          {article.imageUrl && !imgFailed && (
            <figure className="my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.imageAlt || article.title}
                onError={() => setImgFailed(true)}
                className="w-full max-h-80 object-cover rounded-lg border border-border"
              />
              {article.imageAlt && (
                <figcaption className="text-xs text-muted italic mt-2 text-center">
                  {article.imageAlt}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      </AnimateIn>

      {/* Font size control — for long-read comfort */}
      <div className="mt-8 flex justify-end">
        <FontSizeControl />
      </div>

      {/* Columnist bio box — at the end, with link to all their columns */}
      {columnist && (
        <AnimateIn direction="up" delay={0.1}>
          <aside className="mt-12 p-6 rounded-lg bg-paper border-l-4 border-opinion">
            <div className="flex gap-4 items-start">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover stamp-opinion shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-opinion/10 flex items-center justify-center text-2xl font-bold text-opinion stamp-opinion shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-opinion mb-1 font-[family-name:var(--font-heading)]">
                  Sobre el columnista
                </p>
                <h3 className="text-lg font-bold text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide mb-2">
                  {name}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-3">
                  {columnist.bio || "Columnista de ¡QUE NOTICIA!."}
                </p>
                <Link
                  href={`/opinion/columnista/${columnist.slug}`}
                  className="text-xs font-bold uppercase tracking-widest text-opinion hover:underline font-[family-name:var(--font-heading)]"
                >
                  Ver todas sus columnas →
                </Link>
              </div>
            </div>
          </aside>
        </AnimateIn>
      )}

      {/* Comments */}
      <div className="mt-12">
        <CommentSection
          articleId={article.id}
          isCustom={isCustom}
          commentsEnabled={commentsEnabled}
        />
      </div>
        </div>

        {/* Sidebar — 1 col con más opiniones + avisos */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Más opiniones */}
          {moreOpinion.length > 0 && (
            <section className="border border-border rounded-md bg-paper p-4">
              <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-opinion mb-4 font-[family-name:var(--font-heading)] border-b border-rule-opinion pb-2">
                Más opiniones
              </h2>
              <ul className="space-y-4">
                {moreOpinion.map((a) => {
                  const name = a.author ?? "Redacción";
                  return (
                    <li key={a.id}>
                      <Link href={`/opinion/${a.id}`} className="group block">
                        {a.imageUrl && (
                          <div className="relative aspect-[16/10] rounded-md overflow-hidden border border-border bg-paper mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={a.imageUrl}
                              alt={a.imageAlt || a.title}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          </div>
                        )}
                        <p className="text-[10px] uppercase tracking-[0.18em] text-opinion font-bold mb-1 font-[family-name:var(--font-heading)]">
                          {a.volanta || "Opinión"}
                        </p>
                        <h3
                          className="text-sm font-bold font-[family-name:var(--font-heading)] text-ink leading-[1.2] tracking-tight group-hover:text-opinion transition-colors line-clamp-3"
                          style={{ textTransform: "none" }}
                        >
                          {a.title}
                        </h3>
                        <p className="mt-1.5 text-[10px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wider truncate">
                          {name}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Avisos sidebar */}
          {sidebarAds.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-muted font-[family-name:var(--font-heading)]">
                Avisos
              </h2>
              {sidebarAds.slice(0, 4).map((ad) => (
                <div key={ad.id}>
                  <AdRotator ads={[ad]} size="sidebar" />
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>

      {/* Leaderboard bottom — full width 7xl, antes del footer */}
      {leaderboardBottom && (
        <div className="mt-12">
          <AdRotator ads={[leaderboardBottom]} size="leaderboard" />
        </div>
      )}
    </article>
  );
}