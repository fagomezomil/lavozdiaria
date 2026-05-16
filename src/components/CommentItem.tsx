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
  const [deleting, setDeleting] = useState(false);
  const isOwn = user?.id === comment.user_id;
  const initial = comment.user_name?.charAt(0).toUpperCase() || "?";

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este comentario?")) return;
    setDeleting(true);
    await deleteComment(comment.id, comment.article_id);
    setDeleting(false);
  };

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
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{comment.user_name}</span>
          <span className="text-[10px] text-muted">{timeAgo(comment.created_at)}</span>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] text-muted hover:text-[#e63946] transition-colors ml-auto"
              aria-label="Eliminar comentario"
            >
              {deleting ? "..." : "Eliminar"}
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}