"use client";

import { useState, useMemo } from "react";
import SectionHeader from "./SectionHeader";
import CommentCard from "./CommentCard";

interface ComentariosDashboardProps {
  comments: {
    id: string;
    article_id: string;
    article_title: string;
    user_name: string;
    user_avatar_url: string | null;
    content: string;
    created_at: string;
    status: string;
    toxicity_score: number | null;
    report_count: number;
  }[];
}

type SortMode = "recent" | "oldest";
type StatusFilter = "all" | "pending" | "flagged" | "approved" | "rejected";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  pending: "Pendientes",
  flagged: "Reportados",
  approved: "Aprobados",
  rejected: "Rechazados",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[var(--color-urgente)]/15 text-[var(--color-urgente)] border-[var(--color-urgente)]/30",
  flagged: "bg-[#e63946]/10 text-[#e63946] border-[#e63946]/30",
  approved: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30",
  rejected: "bg-ink/10 text-ink/60 border-ink/20",
};

export default function ComentariosDashboard({ comments }: ComentariosDashboardProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const counts = useMemo(() => {
    const c = { all: comments.length, pending: 0, flagged: 0, approved: 0, rejected: 0 };
    for (const cm of comments) {
      if (cm.status in c) c[cm.status as keyof typeof c]++;
    }
    return c;
  }, [comments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const filteredList = comments.filter((comment) => {
      if (statusFilter !== "all" && comment.status !== statusFilter) return false;
      if (search === "") return true;
      return (
        comment.content.toLowerCase().includes(q) ||
        comment.user_name.toLowerCase().includes(q) ||
        comment.article_title.toLowerCase().includes(q)
      );
    });
    const sorted = [...filteredList].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === "recent" ? tb - ta : ta - tb;
    });
    return sorted;
  }, [comments, search, sort, statusFilter]);

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

  const hasActiveFilters = search !== "" || sort !== "recent" || statusFilter !== "pending";

  const clearFilters = () => {
    setSearch("");
    setSort("recent");
    setStatusFilter("pending");
  };

  return (
    <>
      <SectionHeader
        title="Comentarios"
        count={comments.length}
        searchPlaceholder="Buscar por contenido, usuario o nota..."
        searchValue={search}
        onSearchChange={setSearch}
        toolbarRight={viewToggle}
      />

      {/* Filtros por status */}
      <div className="flex items-center gap-1 flex-wrap mb-3 -mt-3">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => {
          const count = counts[key];
          const isActive = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1 text-xs font-semibold tracking-wide rounded-full border transition-colors ${
                isActive
                  ? "bg-ink text-white border-ink"
                  : "bg-paper border-border text-muted hover:text-ink hover:border-ink/30"
              }`}
            >
              {STATUS_LABELS[key]}
              <span className={`ml-1.5 ${isActive ? "text-white/70" : "text-muted/70"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros secundarios: orden + borrar + count */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="px-3 py-1.5 text-xs border border-border rounded bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          <option value="recent">Más recientes primero</option>
          <option value="oldest">Más antiguos primero</option>
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
          {filtered.length} de {comments.length} comentarios
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">
            {statusFilter === "pending" ? "No hay comentarios pendientes. 🎉" : "No se encontraron comentarios."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </>
  );
}