import Link from "next/link";
import type { CustomArticle } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import ArticleToggleActive from "@/components/admin/ArticleToggleActive";
import ArticleDeleteButton from "@/components/admin/ArticleDeleteButton";

export default function ArticleRow({ article }: { article: CustomArticle }) {
  const cfg = sectionConfig[article.section];

  return (
    <tr className="hover:bg-[#f8f5f0] transition-colors">
      <td className="px-4 py-3">
        {article.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={article.imageUrl}
            alt={article.imageAlt}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div
            className="w-12 h-12 rounded flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)` }}
          >
            <span className="text-xs font-[family-name:var(--font-heading)] opacity-25" style={{ color: cfg.color }}>
              LV
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 text-white rounded"
            style={{ backgroundColor: cfg.color }}
          >
            {cfg.label}
          </span>
          <span className="font-semibold text-ink line-clamp-1">{article.title}</span>
        </div>
        {article.excerpt && (
          <p className="text-xs text-muted mt-0.5 line-clamp-1">{article.excerpt}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <ArticleToggleActive id={article.id} active={article.active} />
      </td>
      <td className="px-4 py-3 text-xs text-muted">{article.date}</td>
      <td className="px-4 py-3 text-right space-x-3">
        <Link
          href={`/admin/articles/${article.id}/edit`}
          className="text-xs text-[#3b82f6] hover:underline"
        >
          Editar
        </Link>
        <ArticleDeleteButton id={article.id} />
      </td>
    </tr>
  );
}