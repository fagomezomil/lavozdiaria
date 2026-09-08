"use client";

import { useState, useMemo } from "react";
import SectionHeader from "./SectionHeader";
import RevisionCard from "./RevisionCard";
import type { RevisionArticle } from "@/lib/types";

interface RevisionDashboardProps {
  articles: RevisionArticle[];
}

type StatusFilter = "pending" | "approved" | "all";

const STATUS_LABELS: Record<StatusFilter, string> = {
  pending: "Pendientes",
  approved: "Aprobadas",
  all: "Todas",
};

function deriveStatus(art: RevisionArticle): "pending" | "approved" {
  // Pendiente si manual_review_required=true (espera aprobación).
  // Aprobada si manual_review_required=false y enhanced_at NO es null.
  if (art.manualReviewRequired) return "pending";
  return "approved";
}

export default function RevisionDashboard({ articles }: RevisionDashboardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const counts = useMemo(() => {
    const c = { all: articles.length, pending: 0, approved: 0 };
    for (const a of articles) {
      const s = deriveStatus(a);
      if (s === "pending") c.pending++;
      else c.approved++;
    }
    return c;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return articles.filter((a) => {
      const status = deriveStatus(a);
      if (statusFilter === "pending" && status !== "pending") return false;
      if (statusFilter === "approved" && status !== "approved") return false;
      if (search === "") return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.originalTitle ?? "").toLowerCase().includes(q) ||
        (a.body ?? "").toLowerCase().includes(q)
      );
    });
  }, [articles, search, statusFilter]);

  return (
    <>
      <SectionHeader
        title="Revisión LLM"
        count={articles.length}
        searchPlaceholder="Buscar por título o contenido..."
        searchValue={search}
        onSearchChange={setSearch}
        toolbarRight={
          <span className="text-xs text-muted">
            Agente: Groq · GPT-OSS 120B
          </span>
        }
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

      <div className="text-xs text-muted mb-4">
        {filtered.length} de {articles.length} notas · Diff lado a lado entre el original de la fuente y la nueva versión generada por el agente LLM.
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">
            {statusFilter === "pending"
              ? "No hay notas pendientes de revisión. 🎉"
              : "No se encontraron notas."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article) => (
            <RevisionCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}