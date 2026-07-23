"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminEvent } from "@/lib/agenda";
import type { AgendaCategory } from "@/lib/types";
import SectionHeader from "./SectionHeader";
import { toggleEventActive, toggleEventFeatured, deleteEvent } from "@/app/admin/agenda/actions";

const CAT_META: Record<AgendaCategory, { label: string; color: string }> = {
  cultural: { label: "Cultural", color: "#db2777" },
  turistico: { label: "Turístico", color: "#0891b2" },
  deportivo: { label: "Deportivo", color: "#65a30d" },
};

const SOURCE_LABELS: Record<string, string> = {
  teatro_alberdi: "Teatro Alberdi",
  mercedes_sosa: "Mercedes Sosa",
  smt: "SMT (Rosita Ávila)",
  cultura_tucuman: "Cultura Tucumán",
  turismo_tucuman: "Turismo Tucumán",
  manual: "Carga manual",
};

function EventCard({ event }: { event: AdminEvent }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const cat = CAT_META[event.category];
  const isManual = event.sourceName === "manual";

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        await toggleEventActive(event.id, !event.active);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  };

  const handleToggleFeatured = () => {
    startTransition(async () => {
      try {
        await toggleEventFeatured(event.id, !event.featured);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`¿Eliminar "${event.title}"?\nEsta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      try {
        await deleteEvent(event.id);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  };

  return (
    <div
      className={`bg-paper rounded-lg border p-3 group transition-shadow hover:shadow-md ${
        event.featured ? "border-agenda shadow-sm" : "border-border"
      } ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="shrink-0">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.imageUrl}
              alt={event.imageAlt || event.title}
              className="w-16 h-16 object-cover rounded border-t-2"
              style={{ borderTopColor: cat.color }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded flex items-center justify-center border-t-2"
              style={{
                borderTopColor: cat.color,
                background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)`,
              }}
            >
              <span className="text-lg font-[family-name:var(--font-heading)] opacity-15" style={{ color: cat.color }}>
                ★
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              {cat.label}
            </span>
            {event.subcategory && (
              <span className="text-[10px] uppercase tracking-wide text-muted">
                {event.subcategory}
              </span>
            )}
            {event.featured && (
              <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-agenda/15 text-agenda">
                ★ Destacado
              </span>
            )}
            {!event.active && (
              <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#e63946]/15 text-[#e63946]">
                Oculto
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] line-clamp-1">
            {event.title}
          </h3>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted flex-wrap">
            <span>
              {event.dateLabel.name} {event.dateLabel.num} · {event.time || "s/h"}
            </span>
            {event.venueName && <span>· {event.venueName}</span>}
            {event.venueCity && <span>· {event.venueCity}</span>}
          </div>

          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
            <span className="uppercase tracking-wide">
              {SOURCE_LABELS[event.sourceName] || event.sourceName}
            </span>
            {event.price && <span>· {event.price}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0 text-xs">
          <button
            onClick={handleToggleFeatured}
            disabled={pending}
            className={`px-2 py-0.5 rounded font-bold text-left disabled:cursor-not-allowed ${
              event.featured
                ? "bg-agenda/15 text-agenda"
                : "bg-ink/5 text-muted hover:bg-ink/10"
            }`}
            title="Marcar como destacado en la home"
          >
            {event.featured ? "★ Destacado" : "☆ Destacar"}
          </button>
          <button
            onClick={handleToggleActive}
            disabled={pending}
            className={`px-2 py-0.5 rounded font-bold text-left disabled:cursor-not-allowed ${
              event.active
                ? "bg-[#10b981]/15 text-[#10b981]"
                : "bg-[#e63946]/15 text-[#e63946]"
            }`}
          >
            {event.active ? "Visible" : "Oculto"}
          </button>
          {isManual && (
            <Link
              href={`/admin/agenda/${event.id}/edit`}
              className="font-semibold text-ink hover:text-agenda transition-colors text-left"
            >
              Editar
            </Link>
          )}
          <button
            onClick={handleDelete}
            disabled={pending}
            className="font-semibold text-[#e63946] hover:underline text-left disabled:cursor-not-allowed"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

interface AgendaDashboardProps {
  events: AdminEvent[];
}

export default function AgendaDashboard({ events }: AgendaDashboardProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("active");

  const sources = useMemo(() => {
    const s = new Set(events.map((e) => e.sourceName));
    return Array.from(s).sort();
  }, [events]);

  const filters = [
    { label: "Visibles", value: "active", color: "#10b981" },
    { label: "Ocultos", value: "inactive", color: "#94a3b8" },
    { label: "Destacados", value: "featured", color: "#db2777" },
    { label: "Todos", value: "all" },
  ];

  const catFilters = [
    { label: "Todas", value: "all" },
    { label: "Cultural", value: "cultural", color: "#db2777" },
    { label: "Turístico", value: "turistico", color: "#0891b2" },
    { label: "Deportivo", value: "deportivo", color: "#65a30d" },
  ];

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return events.filter((e) => {
      if (catFilter !== "all" && e.category !== catFilter) return false;
      if (sourceFilter !== "all" && e.sourceName !== sourceFilter) return false;
      if (activeFilter === "active" && !e.active) return false;
      if (activeFilter === "inactive" && e.active) return false;
      if (activeFilter === "featured" && !e.featured) return false;
      if (search) {
        const matches =
          e.title.toLowerCase().includes(searchLower) ||
          (e.venueName || "").toLowerCase().includes(searchLower) ||
          (e.venueCity || "").toLowerCase().includes(searchLower) ||
          (e.subcategory || "").toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });
  }, [events, catFilter, sourceFilter, activeFilter, search]);

  const hasActiveFilters = catFilter !== "all" || sourceFilter !== "all" || activeFilter !== "active" || search !== "";

  return (
    <>
      <SectionHeader
        title="Agenda"
        subtitle="Eventos scrapeados + carga manual. Toggle visible/destacado, eliminar."
        action={{ label: "+ Nuevo evento manual", href: "/admin/agenda/new" }}
        count={events.length}
        searchPlaceholder="Buscar por título, venue, ciudad, subcategoría..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Filtros secundarios: categoría + fuente */}
      <div className="flex items-center gap-3 mb-3 -mt-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-ink/5 rounded">
          {catFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setCatFilter(f.value)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                catFilter === f.value
                  ? "bg-white shadow-sm text-ink"
                  : "text-muted hover:text-ink"
              }`}
              style={catFilter === f.value && f.color ? { color: f.color } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        {sources.length > 0 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded text-xs font-semibold bg-white border border-border text-ink"
          >
            <option value="all">Todas las fuentes</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s] || s}
              </option>
            ))}
          </select>
        )}

        <div className="text-xs text-muted ml-auto">
          {filtered.length} de {events.length} eventos
          {hasActiveFilters && (
            <button
              onClick={() => {
                setCatFilter("all");
                setSourceFilter("all");
                setActiveFilter("active");
                setSearch("");
              }}
              className="ml-3 underline hover:text-ink"
            >
              borrar filtros
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">
            {events.length === 0
              ? "No hay eventos en la tabla. Corré los scrapers o cargá uno manual."
              : "No se encontraron eventos con los filtros actuales."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
}