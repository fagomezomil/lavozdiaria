"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { approveEnhancedArticle, rejectEnhancedArticle } from "@/app/admin/articles/actions";
import type { RevisionArticle, Section } from "@/lib/types";
import { sectionConfig, DRAFT_SOURCE_LABELS } from "@/lib/types";

interface RevisionCardProps {
  article: RevisionArticle;
}

export default function RevisionCard({ article }: RevisionCardProps) {
  const [pending, startTransition] = useTransition();
  const [confirmReject, setConfirmReject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section>(
    article.section as Section,
  );

  const section = article.section as Section;
  const sectionColor = sectionConfig[selectedSection]?.color ?? "#0a0a0a";
  const isPending = article.manualReviewRequired;
  const enhancedDate = article.enhancedAt
    ? new Date(article.enhancedAt).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveEnhancedArticle(article.id, selectedSection);
      if (res.error) setError(res.error);
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const res = await rejectEnhancedArticle(article.id);
      if (res.error) setError(res.error);
      else setConfirmReject(false);
    });
  };

  return (
    <article
      className="bg-paper border border-border rounded-lg overflow-hidden"
      style={{ borderLeft: `4px solid ${sectionColor}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-ink/2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded text-white"
            style={{ backgroundColor: sectionColor }}
          >
            {sectionConfig[selectedSection]?.label ?? selectedSection}
          </span>
          <span className="text-xs text-muted">
            Enhanced: {enhancedDate} · {article.enhancerVersion ?? "v?"}
          </span>
          {isPending ? (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-[var(--color-urgente)]/15 text-[var(--color-urgente)] border border-[var(--color-urgente)]/30">
              Pendiente
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
              Aprobada
            </span>
          )}
        </div>
        <Link
          href={`/admin/articles/${article.id}/edit`}
          className="text-xs text-muted hover:text-ink underline underline-offset-2"
        >
          Editar
        </Link>
      </div>

      {/* Diff lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {/* Columna original */}
        <div className="bg-paper p-4">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-2">
            Original · {DRAFT_SOURCE_LABELS[article.source] ?? article.source}
          </div>
          <h3 className="text-sm font-bold text-ink mb-2 leading-snug">
            {article.originalTitle ?? "(sin título original guardado)"}
          </h3>
          {article.originalUrl && (
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-[10px] text-muted hover:text-ink underline break-all block mb-3"
            >
              {article.originalUrl}
            </a>
          )}
          <div className="text-xs text-ink/80 whitespace-pre-wrap line-clamp-[20] overflow-hidden">
            {article.originalBody ?? "(sin body original guardado)"}
          </div>
        </div>

        {/* Columna generada por LLM */}
        <div className="bg-paper p-4">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-brand)] mb-2">
            Nueva versión · ¡QUE NOTICIA!
          </div>
          {article.volanta && (
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-brand)] mb-1">
              {article.volanta}
            </div>
          )}
          <h3 className="text-sm font-bold text-ink mb-2 leading-snug">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-xs text-ink/60 italic mb-3">{article.excerpt}</p>
          )}
          <div className="text-xs text-ink whitespace-pre-wrap line-clamp-[20] overflow-hidden">
            {article.body ?? "(sin body generado)"}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-wrap">
        {isPending && !confirmReject && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-semibold tracking-wide uppercase text-[10px]">Sección</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as Section)}
                disabled={pending}
                className="text-xs font-semibold border border-border rounded px-2 py-1 bg-paper text-ink focus:outline-none focus:border-ink/40 disabled:opacity-50"
              >
                {(Object.keys(sectionConfig) as Section[]).map((s) => (
                  <option key={s} value={s}>
                    {sectionConfig[s]?.label ?? s}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleApprove}
              disabled={pending}
              className="px-4 py-1.5 text-xs font-bold tracking-wide rounded bg-[#10b981] text-white hover:bg-[#0f9368] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? "Aprobando…" : "Aprobar y publicar"}
            </button>
            <button
              onClick={() => setConfirmReject(true)}
              disabled={pending}
              className="px-4 py-1.5 text-xs font-bold tracking-wide rounded bg-paper border border-border text-ink/70 hover:bg-ink/5 hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Rechazar
            </button>
          </>
        )}
        {isPending && confirmReject && (
          <>
            <span className="text-xs text-ink/70">
              ¿Seguro? Vuelve al original como draft.
            </span>
            <button
              onClick={handleReject}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-bold tracking-wide rounded bg-[#e63946] text-white hover:bg-[#c12932] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? "Rechazando…" : "Sí, rechazar"}
            </button>
            <button
              onClick={() => setConfirmReject(false)}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-bold tracking-wide rounded bg-paper border border-border text-muted hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
        {!isPending && (
          <span className="text-xs text-muted">
            Ya aprobada ·{" "}
            <Link
              href={`/${section}/${article.id}`}
              className="text-ink hover:underline underline-offset-2"
            >
              ver publicada
            </Link>
          </span>
        )}
        {error && (
          <span className="text-xs text-[var(--color-urgente)] ml-auto">{error}</span>
        )}
      </div>
    </article>
  );
}