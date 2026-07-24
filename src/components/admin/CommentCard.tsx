"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteComment, moderateComment } from "@/lib/actions/comments";

interface CommentCardProps {
  comment: {
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
  };
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pending: { label: "Pendiente", class: "bg-[var(--color-urgente)]/15 text-[var(--color-urgente)]" },
  flagged: { label: "Reportado", class: "bg-[#e63946]/15 text-[#e63946]" },
  approved: { label: "Aprobado", class: "bg-[#10b981]/15 text-[#10b981]" },
  rejected: { label: "Rechazado", class: "bg-ink/10 text-ink/60" },
};

export default function CommentCard({ comment }: CommentCardProps) {
  const router = useRouter();
  const initials = comment.user_name.charAt(0).toUpperCase();
  const [acting, setActing] = useState<string | null>(null);

  const badge = STATUS_BADGE[comment.status] ?? STATUS_BADGE.approved;
  const isHighToxicity = comment.toxicity_score !== null && comment.toxicity_score >= 0.4;

  const runModeration = async (action: "approve" | "reject" | "flag") => {
    setActing(action);
    const result = await moderateComment(comment.id, action);
    setActing(null);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este comentario permanentemente?")) return;
    const result = await deleteComment(comment.id);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="bg-paper rounded-lg border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {comment.user_avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.user_avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-ink">{comment.user_name}</span>
            <span className="text-[11px] text-muted">{timeAgo(comment.created_at)}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.class}`}>
              {badge.label}
            </span>
            {comment.toxicity_score !== null && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isHighToxicity
                    ? "bg-[var(--color-urgente)]/20 text-[var(--color-urgente)]"
                    : "bg-ink/5 text-muted"
                }`}
                title="Puntaje de toxicidad (Perspective API)"
              >
                Tox: {Math.round(comment.toxicity_score * 100)}%
              </span>
            )}
            {comment.report_count > 0 && (
              <span className="text-[10px] font-semibold text-[#e63946] bg-[#e63946]/10 px-1.5 py-0.5 rounded">
                {comment.report_count} reporte{comment.report_count > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <p className="text-xs text-muted">
            En&ensp;
            <Link href={`/${comment.article_id}`} className="text-[var(--color-focus)] hover:underline line-clamp-1">
              {comment.article_title}
            </Link>
          </p>

          <p className="text-sm text-ink/80 mt-1.5 leading-relaxed">{comment.content}</p>

          <div className="mt-2 pt-2 border-t border-border flex items-center gap-3 flex-wrap">
            {comment.status !== "approved" && (
              <button
                onClick={() => runModeration("approve")}
                disabled={acting !== null}
                className="text-xs font-semibold text-[#10b981] hover:text-[#10b981]/80 transition-colors disabled:opacity-50"
              >
                {acting === "approve" ? "..." : "Aprobar"}
              </button>
            )}
            {comment.status !== "rejected" && (
              <button
                onClick={() => runModeration("reject")}
                disabled={acting !== null}
                className="text-xs font-semibold text-[var(--color-urgente)] hover:opacity-80 transition-colors disabled:opacity-50"
              >
                {acting === "reject" ? "..." : "Rechazar"}
              </button>
            )}
            {comment.status !== "flagged" && (
              <button
                onClick={() => runModeration("flag")}
                disabled={acting !== null}
                className="text-xs font-semibold text-[#e63946] hover:opacity-80 transition-colors disabled:opacity-50"
              >
                {acting === "flag" ? "..." : "Marcar"}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-xs font-semibold text-muted hover:text-[#e63946] transition-colors ml-auto"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}