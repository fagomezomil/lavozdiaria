"use client";

import { useState, useMemo } from "react";
import type { CustomArticle } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import AdminArticleCard from "./AdminArticleCard";
import SectionHeader from "./SectionHeader";

interface NotasDashboardProps {
  articles: CustomArticle[];
}

export default function NotasDashboard({ articles }: NotasDashboardProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [layoutFilter, setLayoutFilter] = useState<string>("all");
  const [flagFilter, setFlagFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");

  const filters = [
    { label: "Todas", value: "all" },
    ...Object.entries(sectionConfig).map(([key, cfg]) => ({
      label: cfg.label,
      value: key,
      color: cfg.color,
    })),
  ];

  const layoutFilters = [
    { label: "Todos los formatos", value: "all" },
    { label: "Urgente", value: "urgente" },
    { label: "Normal", value: "normal" },
  ];

  const flagFilters = [
    { label: "Todas las notas", value: "all" },
    { label: "Destacadas", value: "featured" },
    { label: "Fijadas", value: "pinned" },
  ];

  const dateFilters = [
    { label: "Todas las fechas", value: "all" },
    { label: "Hoy", value: "today" },
    { label: "Ayer", value: "yesterday" },
    { label: "Últimos 7 días", value: "7d" },
    { label: "Último mes", value: "30d" },
  ];

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const cutoff7d = new Date(now.getTime() - 7 * 86400000);
    const cutoff30d = new Date(now.getTime() - 30 * 86400000);

    return articles.filter((article) => {
      if (activeFilter !== "all" && article.section !== activeFilter) return false;
      if (layoutFilter !== "all" && (article.layout || "normal") !== layoutFilter) return false;
      if (flagFilter === "featured" && !article.featured) return false;
      if (flagFilter === "pinned" && !article.pinned) return false;
      if (dateFilter !== "all") {
        const ts = article.created_at;
        if (!ts) return false;
        const d = new Date(ts);
        if (dateFilter === "today") {
          if (d < startOfToday) return false;
        } else if (dateFilter === "yesterday") {
          if (d < startOfYesterday || d >= startOfToday) return false;
        } else if (dateFilter === "7d") {
          if (d < cutoff7d) return false;
        } else if (dateFilter === "30d") {
          if (d < cutoff30d) return false;
        }
      }
      if (search !== "") {
        const matchesSearch =
          article.title.toLowerCase().includes(searchLower) ||
          (article.author || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [articles, activeFilter, layoutFilter, flagFilter, dateFilter, search]);

  const viewToggle = (
    <div className="ml-auto flex items-center gap-1 p-1 bg-ink/5 rounded">
      <button
        onClick={() => setViewMode("cards")}
        title="Vista de tarjetas"
        className={`p-1.5 rounded transition-colors ${
          viewMode === "cards" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
        }`}
        aria-label="Vista de tarjetas"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode("list")}
        title="Vista de lista"
        className={`p-1.5 rounded transition-colors ${
          viewMode === "list" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
        }`}
        aria-label="Vista de lista"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  );

  const hasActiveFilters =
    activeFilter !== "all" ||
    layoutFilter !== "all" ||
    flagFilter !== "all" ||
    dateFilter !== "today" ||
    search !== "";

  const clearFilters = () => {
    setActiveFilter("all");
    setLayoutFilter("all");
    setFlagFilter("all");
    setDateFilter("today");
    setSearch("");
  };

  return (
    <>
      <SectionHeader
        title="Notas Periodísticas"
        action={{ label: "+ Nueva Nota", href: "/admin/articles/new" }}
        count={articles.length}
        searchPlaceholder="Buscar por título o autor..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        toolbarRight={viewToggle}
      />

      {/* Filtros secundarios: formato + fecha + borrar + count */}
      <div className="flex items-center gap-3 flex-wrap mb-4 -mt-3">
        <select
          value={layoutFilter}
          onChange={(e) => setLayoutFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-border rounded bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          {layoutFilters.map((lf) => (
            <option key={lf.value} value={lf.value}>{lf.label}</option>
          ))}
        </select>

        <select
          value={flagFilter}
          onChange={(e) => setFlagFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-border rounded bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          {flagFilters.map((ff) => (
            <option key={ff.value} value={ff.value}>{ff.label}</option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-border rounded bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          {dateFilters.map((df) => (
            <option key={df.value} value={df.value}>{df.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded whitespace-nowrap transition-colors bg-paper border border-border text-muted hover:text-ink hover:border-ink/30 flex items-center gap-1"
            title="Borrar todos los filtros"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Borrar filtros
          </button>
        )}

        <span className="text-xs text-muted ml-auto">
          {filtered.length} de {articles.length} notas
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontraron notas con los filtros actuales.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <AdminArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <AdminArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}