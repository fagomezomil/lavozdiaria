import Link from "next/link";
import type { Article, Columnist } from "@/lib/types";
import OpinionCard from "./OpinionCard";

interface OpinionBlockProps {
  articles: Article[];
  columnists: Columnist[];
}

export default function OpinionBlock({ articles, columnists }: OpinionBlockProps) {
  if (articles.length === 0) return null;

  const columnistById = new Map(columnists.map((c) => [c.id, c]));
  // Show up to 4 most recent opinion articles
  const picks = articles.slice(0, 4);

  return (
    <section className="mb-10">
      <div
        className="border-t-2 pt-2 mb-4 flex items-center justify-between"
        style={{ borderTopColor: "#0d9488" }}
      >
        <h2
          className="text-sm font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
          style={{ color: "#0d9488" }}
        >
          Opinión
        </h2>
        <Link
          href="/opinion"
          className="text-xs font-semibold hover:underline"
          style={{ color: "#0d9488" }}
        >
          +Opinión
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3  rounded-lg">
        {picks.map((a) => (
          <OpinionCard
            key={a.id}
            article={a}
            columnist={a.columnistId ? columnistById.get(a.columnistId) : undefined}
          />
        ))}
      </div>
    </section>
  );
}