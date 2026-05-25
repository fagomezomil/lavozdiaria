"use client";

import Link from "next/link";
import type { CustomArticle, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import ArticleToggleActive from "./ArticleToggleActive";
import ArticleDeleteButton from "./ArticleDeleteButton";

interface AdminArticleCardProps {
  article: CustomArticle;
}

const LAYOUT_LABELS: Record<string, { label: string; color: string }> = {
  urgente: { label: "URGENTE", color: "#c8102e" },
  destacada: { label: "DESTACADA", color: "#3b82f6" },
  normal: { label: "Normal", color: "#6b6b6b" },
};

export default function AdminArticleCard({ article }: AdminArticleCardProps) {
  const cfg = sectionConfig[article.section as Section];
  const layoutInfo = LAYOUT_LABELS[article.layout || "normal"] || LAYOUT_LABELS.normal;

  return (
    <div className="bg-paper rounded-lg border border-border p-3 hover:shadow-md transition-shadow group">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <Link href={`/admin/articles/${article.id}/edit`} className="shrink-0">
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
          </div>

          <Link href={`/admin/articles/${article.id}/edit`} className="block group-hover:underline">
            <h3 className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] line-clamp-1">
              {article.title}
            </h3>
          </Link>

          {article.excerpt && (
            <p className="text-xs text-muted line-clamp-1 mt-0.5">{article.excerpt}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted">
            <ArticleToggleActive id={article.id} active={article.active} />
            {article.comments_enabled && (
              <span>💬 Comentarios</span>
            )}
            <span>{article.date}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <Link
            href={`/admin/articles/${article.id}/edit`}
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