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
    { label: "Destacada", value: "destacada" },
    { label: "Normal", value: "normal" },
  ];

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return articles.filter((article) => {
      if (activeFilter !== "all" && article.section !== activeFilter) return false;
      if (layoutFilter !== "all" && (article.layout || "normal") !== layoutFilter) return false;
      if (search !== "") {
        const matchesSearch =
          article.title.toLowerCase().includes(searchLower) ||
          (article.author || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [articles, activeFilter, layoutFilter, search]);

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
    search !== "";

  const clearFilters = () => {
    setActiveFilter("all");
    setLayoutFilter("all");
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

      {/* Filtros secundarios: formato + borrar + count */}
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