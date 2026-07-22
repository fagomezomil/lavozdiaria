"use client";

import { useState, useMemo } from "react";
import type { CustomArticle, Columnist } from "@/lib/types";
import AdminArticleCard from "./AdminArticleCard";
import SectionHeader from "./SectionHeader";

interface OpinionDashboardProps {
  articles: CustomArticle[];
  columnists: Columnist[];
}

export default function OpinionDashboard({ articles, columnists }: OpinionDashboardProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");

  const filters = [
    { label: "Todas", value: "all" },
    { label: "Activas", value: "active", color: "#10b981" },
    { label: "Inactivas", value: "inactive", color: "#94a3b8" },
    { label: "Con columnista", value: "with_columnist", color: "#0d9488" },
    { label: "Sin columnista", value: "no_columnist", color: "#f59e0b" },
  ];

  const columnistName = (id?: string) => columnists.find((c) => c.id === id)?.name;

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return articles.filter((article) => {
      if (activeFilter === "active" && !article.active) return false;
      if (activeFilter === "inactive" && article.active) return false;
      if (activeFilter === "with_columnist" && !article.columnistId) return false;
      if (activeFilter === "no_columnist" && article.columnistId) return false;
      if (search) {
        const colName = columnistName(article.columnistId) || "";
        const matches =
          article.title.toLowerCase().includes(searchLower) ||
          (article.author || "").toLowerCase().includes(searchLower) ||
          (article.volanta || "").toLowerCase().includes(searchLower) ||
          colName.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });
  }, [articles, activeFilter, search, columnists]);

  const viewToggle = (
    <div className="ml-auto flex items-center gap-1 p-1 bg-ink/5 rounded">
      <button
        onClick={() => setViewMode("cards")}
        title="Vista de tarjetas"
        className={`p-1.5 rounded transition-colors ${viewMode === "cards" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}
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
        className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}
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

  const hasActiveFilters = activeFilter !== "all" || search !== "";

  return (
    <>
      <SectionHeader
        title="Notas de Opinión"
        subtitle="Editorial propio — no se alimenta del scraper"
        action={{ label: "+ Nueva Nota de Opinión", href: "/admin/articles/new?section=opinion&ref=opinion" }}
        count={articles.length}
        searchPlaceholder="Buscar por título, volanta, autor o columnista..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        toolbarRight={viewToggle}
      />

      <div className="text-xs text-muted mb-3 -mt-3">
        {filtered.length} de {articles.length} notas
        {hasActiveFilters && (
          <button
            onClick={() => {
              setActiveFilter("all");
              setSearch("");
            }}
            className="ml-3 underline hover:text-ink"
          >
            borrar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">
            {articles.length === 0
              ? "Aún no hay notas de opinión. Creá la primera con \"+ Nueva Nota de Opinión\"."
              : "No se encontraron notas con los filtros actuales."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <AdminArticleCard
              key={article.id}
              article={article}
              editHref={`/admin/articles/${article.id}/edit?ref=opinion`}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <AdminArticleCard
              key={article.id}
              article={article}
              editHref={`/admin/articles/${article.id}/edit?ref=opinion`}
            />
          ))}
        </div>
      )}
    </>
  );
}