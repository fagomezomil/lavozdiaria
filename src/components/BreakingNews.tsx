import Link from "next/link";
import { Article, sectionConfig } from "@/lib/types";

interface BreakingNewsProps {
  articles: Article[];
}

export default function BreakingNews({ articles }: BreakingNewsProps) {
  const breaking = articles.filter((a) => a.breaking);
  if (breaking.length === 0) return null;

  // Marquee infinito: 2 copias idénticas del contenido y keyframes -50%.
  // El separador va después de CADA nota (sin condicional en la última) para
  // que el punto quede continuo en el empalme copia1→copia2.
  const renderList = (copy: string) => (
    <>
      {breaking.map((a) => (
        <span key={`${copy}-${a.id}`}>
          <Link
            href={`/${a.section}/${a.id}`}
            className="hover:text-ink hover:bg-white px-1 transition-colors"
          >
            {a.title}
          </Link>
          <span className="mx-6 text-brand">●</span>
        </span>
      ))}
    </>
  );

  // Duración proporcional a la cantidad de notas (el ciclo recorre 1 copia).
  const duration = Math.max(20, breaking.length * 6);

  return (
    <div className="bg-urgente text-white py-2.5 relative overflow-hidden border-y-2 border-ink">
      {/* Halftone overlay */}
      <div className="absolute inset-0 halftone-light opacity-40 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 relative">
        <span className="text-[10px] font-black tracking-widest uppercase bg-white text-urgente px-2 py-1 shrink-0 font-[family-name:var(--font-heading)] border-2 border-ink shadow-hard-sm">
          Última Hora
        </span>
        <div className="overflow-hidden relative flex-1">
          <div
            className="animate-marquee whitespace-nowrap text-sm font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wide"
            style={{ animationDuration: `${duration}s` }}
          >
            {renderList("a")}
            <span aria-hidden="true">{renderList("b")}</span>
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-8 fade-urgente-r pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 fade-urgente-l pointer-events-none" />
        </div>
      </div>
    </div>
  );
}