"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Ad, AgendaEvent, AgendaCategory } from "@/lib/types";
import AdRotator from "@/components/AdRotator";
import AnimateIn from "@/components/animate/AnimateIn";

// Re-export para backwards compat (otros archivos pueden importar desde acá o desde types)
export type { AgendaEvent, AgendaCategory };

interface AgendaLayoutProps {
  events: AgendaEvent[];
  leaderboardTop?: Ad | null;
  leaderboardBottom?: Ad | null;
  sidebarAds?: Ad[];
}

const CAT_META: Record<AgendaCategory, { label: string; color: string; bgClass: string; textClass: string }> = {
  cultural: { label: "Cultural", color: "var(--color-cat-cultural)", bgClass: "bg-cat-cultural", textClass: "text-cat-cultural" },
  turistico: { label: "Turístico", color: "var(--color-cat-turistico)", bgClass: "bg-cat-turistico", textClass: "text-cat-turistico" },
  deportivo: { label: "Deportivo", color: "var(--color-cat-deportivo)", bgClass: "bg-cat-deportivo", textClass: "text-cat-deportivo" },
};

const SOURCE_LABELS: Record<string, string> = {
  teatro_alberdi: "Teatro Alberdi",
  mercedes_sosa: "Teatro Mercedes Sosa",
  smt: "Municipalidad de SMT",
  cultura_tucuman: "Cultura Tucumán",
  turismo_tucuman: "Turismo Tucumán",
  manual: "Carga manual",
};

/* ===== Modal — desktop centered, mobile bottom sheet ===== */
function EventModal({ event, onClose }: { event: AgendaEvent; onClose: () => void }) {
  const cat = CAT_META[event.category];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-ink/60 backdrop-blur-sm animate-ad-overlay-in p-0 md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div
        className="relative bg-paper border-2 border-ink shadow-hard-lg w-full md:max-w-2xl max-h-[92vh] md:max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-paper border-2 border-ink shadow-hard-sm hover:bg-agenda hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image hero */}
        <div className="relative w-full h-[220px] md:h-[300px] overflow-hidden bg-ink/5">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.imageUrl}
              alt={event.imageAlt || event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full" style={{ background: cat.color }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
          {/* Date pill */}
          <span className="absolute top-3 left-3 bg-paper border-2 border-ink px-2.5 py-1 font-[family-name:var(--font-heading)] text-center leading-none shadow-hard-sm">
            <span className="block text-xl font-bold text-agenda-deep">{event.dateLabel.num}</span>
            <span className="block text-[9px] uppercase tracking-[0.14em]">{event.dateLabel.name}</span>
          </span>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 -mt-8 relative">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`inline-flex items-center text-white text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 ${cat.bgClass}`}>
              {cat.label}
            </span>
            {event.subcategory && (
              <span className="inline-block text-[10px] uppercase tracking-[0.14em] font-semibold border-2 border-ink px-2.5 py-1 font-[family-name:var(--font-heading)]">
                {event.subcategory}
              </span>
            )}
            {event.price && (
              <span className={`inline-block text-[10px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 border-2 border-ink font-[family-name:var(--font-heading)] ${event.isFree ? "bg-cat-deportivo text-white border-cat-deportivo" : "bg-paper"}`}>
                {event.price}
              </span>
            )}
          </div>

          <h2
            className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)] text-ink leading-[1.05] tracking-tight mb-3"
            style={{ textTransform: "none" }}
          >
            {event.title}
          </h2>

          {event.excerpt && !event.description && (
            <p className="text-base text-muted italic leading-[1.55] mb-4">{event.excerpt}</p>
          )}
          {event.description && (
            <p className="text-[15px] text-ink/85 leading-[1.6] mb-4">{event.description}</p>
          )}

          {/* Datos clave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 border-2 border-ink p-4 bg-cream">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted font-[family-name:var(--font-heading)] mb-1">Fecha y hora</p>
              <p className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                {event.dateLabel.name} {event.dateLabel.num} · {event.time}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted font-[family-name:var(--font-heading)] mb-1">Lugar</p>
              <p className="text-sm font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wide">{event.venueName}</p>
              <p className="text-[11px] text-muted">{event.venueCity}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-agenda text-white font-[family-name:var(--font-heading)] uppercase tracking-[0.14em] font-semibold text-xs px-5 py-3 border-2 border-ink shadow-hard-sm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard transition-all"
              >
                Comprar entradas
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 bg-paper text-ink font-[family-name:var(--font-heading)] uppercase tracking-[0.14em] font-semibold text-xs px-5 py-3 border-2 border-ink shadow-hard-sm hover:bg-ink hover:text-paper transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Source tag */}
          <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-muted font-[family-name:var(--font-heading)] opacity-70">
            Fuente: {SOURCE_LABELS[event.sourceName] ?? event.sourceName}
          </p>
        </div>
      </div>
    </div>
  );
}

function EventCard({ e, onOpen }: { e: AgendaEvent; onOpen: (e: AgendaEvent) => void }) {
  const cat = CAT_META[e.category];
  return (
    <button
      onClick={() => onOpen(e)}
      className="group flex flex-col border-2 border-ink bg-paper shadow-hard-sm overflow-hidden transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard text-left"
    >
      <div className="relative w-full h-[180px] overflow-hidden bg-ink/5">
        {e.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.imageUrl}
            alt={e.imageAlt || e.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold opacity-20 font-[family-name:var(--font-heading)]" style={{ color: cat.color }}>
              {e.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {e.subcategory && (
          <span className={`absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white px-2 py-[3px] ${cat.bgClass}`}>
            {e.subcategory}
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 bg-paper border-2 border-ink px-2 py-1 font-[family-name:var(--font-heading)] text-center leading-none shadow-hard-sm">
          <span className="block text-base font-bold">{e.dateLabel.num}</span>
          <span className="block text-[8px] uppercase tracking-[0.14em]">{e.dateLabel.name}</span>
        </span>
      </div>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-agenda-deep font-[family-name:var(--font-heading)]">
          {e.time}
        </span>
        <h3
          className="text-[17px] font-semibold font-[family-name:var(--font-heading)] text-ink leading-[1.15] tracking-tight group-hover:text-agenda transition-colors"
          style={{ textTransform: "none" }}
        >
          {e.title}
        </h3>
        <span className="mt-auto pt-2 border-t border-ink/10 text-[11px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-[0.12em] flex items-center gap-1.5">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <circle cx="12" cy="11" r="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="truncate">{e.venueName} · {e.venueCity}</span>
        </span>
      </div>
    </button>
  );
}

function CategorySection({ category, events, onOpen }: { category: AgendaCategory; events: AgendaEvent[]; onOpen: (e: AgendaEvent) => void }) {
  const cat = CAT_META[category];
  return (
    <section className="mb-9">
      <div className="flex items-center gap-3 mb-4 border-b border-ink pb-2">
        <h2 className={`flex items-center gap-2 text-lg font-bold uppercase tracking-[0.18em] font-[family-name:var(--font-heading)] ${cat.textClass}`}>
          <span className="inline-block w-3.5 h-3.5" style={{ backgroundColor: cat.color }} />
          {cat.label}
        </h2>
        <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-muted font-[family-name:var(--font-heading)]">
          {events.length} evento{events.length !== 1 ? "s" : ""} esta semana
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e) => <EventCard key={e.id} e={e} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function HeroEvent({ e, onOpen }: { e: AgendaEvent; onOpen: (e: AgendaEvent) => void }) {
  const cat = CAT_META[e.category];
  return (
    <button
      onClick={() => onOpen(e)}
      className="group block w-full text-left mb-10 border-2 border-ink bg-paper shadow-hard-lg"
      style={{ boxShadow: "6px 6px 0 var(--color-agenda)" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr]">
        <div className="w-full h-[280px] md:h-[320px] overflow-hidden bg-ink/5">
          {e.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={e.imageUrl}
              alt={e.imageAlt || e.title}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full" style={{ background: cat.color }} />
          )}
        </div>
        <div className="p-6 flex flex-col gap-3 justify-center">
          <span className={`self-start inline-flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 ${cat.bgClass}`}>
            {cat.label} · Destacado de la semana
          </span>
          <span className="self-start inline-flex items-baseline gap-2 border-2 border-ink px-3 py-1 shadow-hard-sm bg-cream">
            <span className="text-2xl font-bold font-[family-name:var(--font-heading)] text-agenda-deep leading-none">{e.dateLabel.num}</span>
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold font-[family-name:var(--font-heading)]">{e.dateLabel.name}</span>
          </span>
          <h2
            className="text-3xl font-bold font-[family-name:var(--font-heading)] text-ink leading-[1.05] tracking-tight"
            style={{ textTransform: "none" }}
          >
            {e.title}
          </h2>
          {e.excerpt && (
            <p className="text-[15px] text-muted italic leading-[1.55]">{e.excerpt}</p>
          )}
          <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.14em] font-[family-name:var(--font-heading)]">
            <span className="font-bold text-ink">{e.venueName}</span>
            <span className="font-bold text-agenda-deep">{e.time}</span>
            <span className="text-muted">{e.venueCity}</span>
          </div>
          <span className="self-start inline-flex items-center gap-2 mt-2 bg-ink text-paper px-4 py-2.5 border-2 border-ink font-[family-name:var(--font-heading)] uppercase tracking-[0.14em] font-semibold text-xs" style={{ boxShadow: "3px 3px 0 var(--color-agenda)" }}>
            Ver evento →
          </span>
        </div>
      </div>
    </button>
  );
}

function MiniRow({ e, onOpen }: { e: AgendaEvent; onOpen: (e: AgendaEvent) => void }) {
  const cat = CAT_META[e.category];
  return (
    <button onClick={() => onOpen(e)} className="block w-full text-left py-2.5 border-b border-ink/10 last:border-b-0 hover:bg-agenda/5 transition-colors -mx-1 px-1 rounded">
      <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-agenda-deep font-[family-name:var(--font-heading)] mb-1">
        {e.dateLabel.name} {e.dateLabel.num} · {e.time}
      </p>
      <p className="text-[13px] font-semibold font-[family-name:var(--font-heading)] leading-[1.2]" style={{ textTransform: "none" }}>
        {e.title}
      </p>
      <p className="text-[10px] text-muted mt-0.5">{e.venueName} · {e.venueCity}</p>
      <span className={`inline-block mt-1 text-[9px] uppercase tracking-[0.12em] font-semibold ${cat.textClass}`}>{cat.label}</span>
    </button>
  );
}

export default function AgendaLayout({
  events,
  leaderboardTop,
  leaderboardBottom,
  sidebarAds = [],
}: AgendaLayoutProps) {
  const [selected, setSelected] = useState<AgendaEvent | null>(null);
  const open = useCallback((e: AgendaEvent) => setSelected(e), []);
  const close = useCallback(() => setSelected(null), []);

  const featured = events.find((e) => e.featured) ?? events[0];
  const rest = events.filter((e) => e.id !== featured?.id);

  const byCat = (cat: AgendaCategory) => rest.filter((e) => e.category === cat);

  // Próximos 7 días = ordenado por date ascendente, top 5
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Masthead */}
      <header className="mb-6 border-b-2 border-agenda pb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted mb-2 font-[family-name:var(--font-heading)]">
          Cartelera de Tucumán · ¡QUE NOTICIA!
        </p>
        <h1
          className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-heading)] text-agenda leading-[0.95] tracking-tight"
          style={{ textTransform: "none" }}
        >
          Agenda
        </h1>
        <p className="mt-3 text-base text-muted italic max-w-2xl font-[family-name:var(--font-body)]">
          Cultural, turística y deportiva. Lo que se mueve en la provincia, día por día. Si tu evento no está, subilo desde el botón rosa.
        </p>
      </header>

      {/* Leaderboard top */}
      {leaderboardTop && (
        <div className="mb-8">
          <AdRotator ads={[leaderboardTop]} size="leaderboard" />
        </div>
      )}

      {/* Filters */}
      <AnimateIn direction="up" delay={0.05}>
        <div className="flex gap-2 mb-7 flex-wrap items-center">
          <button className="text-[11px] uppercase tracking-[0.14em] font-semibold px-3.5 py-1.5 border-2 border-ink bg-ink text-paper font-[family-name:var(--font-heading)]">
            Todas
          </button>
          <button className="text-[11px] uppercase tracking-[0.14em] font-semibold px-3.5 py-1.5 border-2 border-ink bg-paper text-ink font-[family-name:var(--font-heading)] hover:bg-cat-cultural hover:text-white hover:border-cat-cultural transition-colors">
            Cultural
          </button>
          <button className="text-[11px] uppercase tracking-[0.14em] font-semibold px-3.5 py-1.5 border-2 border-ink bg-paper text-ink font-[family-name:var(--font-heading)] hover:bg-cat-turistico hover:text-white hover:border-cat-turistico transition-colors">
            Turístico
          </button>
          <button className="text-[11px] uppercase tracking-[0.14em] font-semibold px-3.5 py-1.5 border-2 border-ink bg-paper text-ink font-[family-name:var(--font-heading)] hover:bg-cat-deportivo hover:text-white hover:border-cat-deportivo transition-colors">
            Deportivo
          </button>
          <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-muted font-[family-name:var(--font-heading)]">
            Julio 2026 · {events.length} eventos
          </span>
        </div>
      </AnimateIn>

      {/* Hero featured */}
      {featured && (
        <AnimateIn direction="up" delay={0.1}>
          <HeroEvent e={featured} onOpen={open} />
        </AnimateIn>
      )}

      {/* Grid: 3 contenido + 1 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <CategorySection category="cultural" events={byCat("cultural")} onOpen={open} />
          <CategorySection category="turistico" events={byCat("turistico")} onOpen={open} />
          <CategorySection category="deportivo" events={byCat("deportivo")} onOpen={open} />

          <div className="text-center mt-6">
            <Link href="/agenda/submit" className="inline-flex items-center gap-2 bg-agenda text-white font-[family-name:var(--font-heading)] uppercase tracking-[0.14em] font-semibold text-xs px-4 py-2.5 border-2 border-ink shadow-hard-sm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard transition-all">
              Envianos tu evento y sumate
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <section className="border-2 border-ink bg-paper p-4 shadow-hard-sm">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-agenda font-bold font-[family-name:var(--font-heading)] border-b border-agenda pb-2 mb-3">
              Próximos 7 días
            </h2>
            {upcoming.map((e) => <MiniRow key={e.id} e={e} onOpen={open} />)}
          </section>

          <Link href="/agenda/submit" className="block w-full text-center font-[family-name:var(--font-heading)] uppercase tracking-[0.14em] font-semibold text-[11px] px-3.5 py-2.5 bg-agenda text-white border-2 border-ink shadow-hard-sm">
            Envianos tu evento
          </Link>

          {sidebarAds.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted font-[family-name:var(--font-heading)]">
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

      {/* Leaderboard bottom */}
      {leaderboardBottom && (
        <div className="mt-12">
          <AdRotator ads={[leaderboardBottom]} size="leaderboard" />
        </div>
      )}

      {/* Modal — desktop centered, mobile bottom sheet */}
      {selected && <EventModal event={selected} onClose={close} />}
    </div>
  );
}