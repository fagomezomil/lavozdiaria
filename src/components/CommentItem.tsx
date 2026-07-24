"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useCommentsStore } from "@/lib/store/comments";
import type { Comment } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days}d`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? "es" : ""}`;
}

export default function CommentItem({ comment }: { comment: Comment }) {
  const user = useAuthStore((s) => s.user);
  const deleteComment = useCommentsStore((s) => s.deleteComment);
  const reportCommentById = useCommentsStore((s) => s.reportCommentById);
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportResult, setReportResult] = useState<string | null>(null);
  const isOwn = user?.id === comment.user_id;
  const initial = comment.user_name?.charAt(0).toUpperCase() || "?";

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este comentario?")) return;
    setDeleting(true);
    await deleteComment(comment.id, comment.article_id);
    setDeleting(false);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    setReportResult(null);
    const result = await reportCommentById(comment.id, reportReason.trim());
    setReporting(false);
    if (result.ok) {
      setReportResult("Reportado. Gracias por ayudar a moderar.");
      setReportReason("");
      setShowReportBox(false);
    } else {
      setReportResult(result.error || "Error al reportar");
    }
  };

  const showPendingBadge = isOwn && comment.status === "pending";

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-shrink-0">
        {comment.user_avatar_url ? (
          <img
            src={comment.user_avatar_url}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink/60">
            {initial}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{comment.user_name}</span>
          <span className="text-[10px] text-muted">{timeAgo(comment.created_at)}</span>
          {showPendingBadge && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-urgente)] bg-[var(--color-urgente)]/10 px-1.5 py-0.5 rounded">
              En revisión
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {user && !isOwn && (
              <button
                onClick={() => setShowReportBox((v) => !v)}
                className="text-[10px] text-muted hover:text-[var(--color-urgente)] transition-colors"
                aria-label="Reportar comentario"
              >
                Reportar
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[10px] text-muted hover:text-[#e63946] transition-colors"
                aria-label="Eliminar comentario"
              >
                {deleting ? "..." : "Eliminar"}
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-foreground/90 leading-relaxed">{comment.content}</p>

        {showReportBox && (
          <div className="mt-2 p-2 border border-border rounded bg-paper">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="¿Por qué lo reportás? (ej: insulto, spam, odio)"
              className="w-full px-2 py-1 text-xs border border-border rounded bg-white resize-none focus:outline-none focus:ring-1 focus:ring-ink/30"
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleReport}
                disabled={reporting || !reportReason.trim()}
                className="px-2 py-0.5 text-[11px] font-semibold bg-[var(--color-urgente)] text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                {reporting ? "Enviando..." : "Enviar reporte"}
              </button>
              <button
                onClick={() => {
                  setShowReportBox(false);
                  setReportReason("");
                  setReportResult(null);
                }}
                className="text-[11px] text-muted hover:text-ink"
              >
                Cancelar
              </button>
            </div>
            {reportResult && (
              <p className="text-[10px] text-muted mt-1">{reportResult}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}