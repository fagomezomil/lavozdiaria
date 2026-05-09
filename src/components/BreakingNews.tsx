import Link from "next/link";
import { Article, sectionConfig } from "@/lib/types";

interface BreakingNewsProps {
  articles: Article[];
}

export default function BreakingNews({ articles }: BreakingNewsProps) {
  const breaking = articles.filter((a) => a.breaking);
  if (breaking.length === 0) return null;

  return (
    <div className="bg-politica text-white py-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-widest uppercase bg-white text-politica px-2 py-0.5 shrink-0">
          Última Hora
        </span>
        <div className="overflow-hidden relative flex-1">
          <div className="animate-marquee whitespace-nowrap text-sm font-medium">
            {breaking.map((a, i) => (
              <span key={a.id}>
                <Link
                  href={`/${a.section}/${a.id}`}
                  className="hover:underline"
                >
                  {a.title}
                </Link>
                {i < breaking.length - 1 && (
                  <span className="mx-6">●</span>
                )}
              </span>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#c8102e] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#c8102e] to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}