"use client";

import Link from "next/link";
import type { CustomArticle, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import ArticleToggleActive from "./ArticleToggleActive";
import ArticleToggleFeatured from "./ArticleToggleFeatured";
import ArticleTogglePinned from "./ArticleTogglePinned";
import ArticleToggleBreaking from "./ArticleToggleBreaking";

const FEATURED_WINDOW_MS = 24 * 60 * 60 * 1000;

function isFeaturedFresh(featured: boolean, featuredAt?: string | null): boolean {
  return Boolean(featured && featuredAt && Date.now() - new Date(featuredAt).getTime() < FEATURED_WINDOW_MS);
}
import ArticleDeleteButton from "./ArticleDeleteButton";

interface AdminArticleCardProps {
  article: CustomArticle;
  editHref?: string;
}

const LAYOUT_LABELS: Record<string, { label: string; color: string }> = {
  urgente: { label: "URGENTE", color: "#c8102e" },
  normal: { label: "Normal", color: "#6b6b6b" },
};

export default function AdminArticleCard({ article, editHref }: AdminArticleCardProps) {
  const cfg = sectionConfig[article.section as Section];
  const layoutInfo = LAYOUT_LABELS[article.layout || "normal"] || LAYOUT_LABELS.normal;
  const editUrl = editHref ?? `/admin/articles/${article.id}/edit`;

  return (
    <div className="bg-paper rounded-lg border border-border p-3 hover:shadow-md transition-shadow group">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <Link href={editUrl} className="shrink-0">
          {article.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt={article.imageAlt || article.title}
              className="w-16 h-16 object-cover rounded border-t-2"
              style={{ borderTopColor: cfg?.color }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded flex items-center justify-center border-t-2"
              style={{ borderTopColor: cfg?.color, background: cfg ? `linear-gradient(135deg, ${cfg.color}15, ${cfg.color}05)` : undefined }}
            >
              <span className="text-lg font-[family-name:var(--font-heading)] opacity-15" style={{ color: cfg?.color }}>LV</span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {cfg && (
              <span
                className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
              >
                {cfg.label}
              </span>
            )}
            <span
              className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${layoutInfo.color}20`, color: layoutInfo.color }}
            >
              {layoutInfo.label}
            </span>
            {article.pinned && (
              <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-ink text-cream">
                FIJADA
              </span>
            )}
            {article.featured && (
              <span
                className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
                style={
                  isFeaturedFresh(article.featured, article.featured_at)
                    ? { backgroundColor: `${"#f97316"}20`, color: "#f97316" }
                    : { backgroundColor: "transparent", color: "#f9731699", border: "1px solid #f9731666" }
                }
              >
                {isFeaturedFresh(article.featured, article.featured_at) ? "DESTACADA" : "DESTACADA VENCIDA"}
              </span>
            )}
          </div>

          <Link href={editUrl} className="block group-hover:underline">
            <h3 className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] line-clamp-1">
              {article.title}
            </h3>
          </Link>

          {article.excerpt && (
            <p className="text-xs text-muted line-clamp-1 mt-0.5">{article.excerpt}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted">
            <ArticleToggleActive id={article.id} active={article.active} />
            <ArticleToggleFeatured
              id={article.id}
              featured={article.featured ?? false}
              featuredAt={article.featured_at ?? null}
            />
            <ArticleTogglePinned id={article.id} pinned={article.pinned ?? false} />
            <ArticleToggleBreaking id={article.id} breaking={article.breaking ?? false} />
            {article.comments_enabled && (
              <span>💬 Comentarios</span>
            )}
            <span>{article.date}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <Link
            href={editUrl}
            className="text-xs font-semibold text-ink hover:text-[var(--color-brand)] transition-colors"
          >
            Editar
          </Link>
          <ArticleDeleteButton id={article.id} />
        </div>
      </div>
    </div>
  );
}