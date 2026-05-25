"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteComment } from "@/app/admin/comments/actions";

interface CommentCardProps {
  comment: {
    id: string;
    article_id: string;
    article_title: string;
    user_name: string;
    user_avatar_url: string | null;
    content: string;
    created_at: string;
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

export default function CommentCard({ comment }: CommentCardProps) {
  const router = useRouter();
  const initials = comment.user_name.charAt(0).toUpperCase();

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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-ink">{comment.user_name}</span>
            <span className="text-[11px] text-muted">{timeAgo(comment.created_at)}</span>
          </div>

          <p className="text-xs text-muted">
            En&ensp;
            <Link href={`/${comment.article_id}`} className="text-[var(--color-focus)] hover:underline line-clamp-1">
              {comment.article_title}
            </Link>
          </p>

          <p className="text-sm text-ink/80 mt-1.5 leading-relaxed">{comment.content}</p>

          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={async () => {
                if (!confirm("¿Eliminar este comentario?")) return;
                const result = await deleteComment(comment.id);
                if (result.error) {
                  alert("Error: " + result.error);
                } else {
                  router.refresh();
                }
              }}
              className="text-xs font-semibold text-[#e63946] hover:text-[#e63946]/80 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}