import Link from "next/link";
import { Article, sectionConfig } from "@/lib/types";

interface BreakingNewsProps {
  articles: Article[];
}

export default function BreakingNews({ articles }: BreakingNewsProps) {
  const breaking = articles.filter((a) => a.breaking);
  if (breaking.length === 0) return null;

  return (
    <div className="bg-urgente text-white py-2.5 relative overflow-hidden border-y-2 border-ink">
      {/* Halftone overlay */}
      <div className="absolute inset-0 halftone-light opacity-40 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 relative">
        <span className="text-[10px] font-black tracking-widest uppercase bg-white text-urgente px-2 py-1 shrink-0 font-[family-name:var(--font-heading)] border-2 border-ink shadow-hard-sm">
          Última Hora
        </span>
        <div className="overflow-hidden relative flex-1">
          <div className="animate-marquee whitespace-nowrap text-sm font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wide">
            {breaking.map((a, i) => (
              <span key={a.id}>
                <Link
                  href={`/${a.section}/${a.id}`}
                  className="hover:text-ink hover:bg-white px-1 transition-colors"
                >
                  {a.title}
                </Link>
                {i < breaking.length - 1 && (
                  <span className="mx-6 text-brand">●</span>
                )}
              </span>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-urgente to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-urgente to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}