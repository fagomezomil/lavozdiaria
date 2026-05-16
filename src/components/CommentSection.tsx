"use client";

import { useEffect } from "react";
import { useCommentsStore } from "@/lib/store/comments";
import CommentItem from "@/components/CommentItem";
import CommentForm from "@/components/CommentForm";

const EMPTY_COMMENTS: never[] = [];

interface CommentSectionProps {
  articleId: string;
  isCustom: boolean;
  commentsEnabled?: boolean;
}

export default function CommentSection({ articleId, isCustom, commentsEnabled = true }: CommentSectionProps) {
  const comments = useCommentsStore((s) => s.commentsByArticle[articleId]) ?? EMPTY_COMMENTS;
  const loading = useCommentsStore((s) => s.loading[articleId]);
  const fetchComments = useCommentsStore((s) => s.fetchComments);

  useEffect(() => {
    if (isCustom && commentsEnabled) {
      fetchComments(articleId);
    }
  }, [articleId, isCustom, commentsEnabled, fetchComments]);

  if (!isCustom || !commentsEnabled) return null;

  return (
    <div className="mt-10 pt-6 border-t-2 border-ink">
      <h2
        className="text-sm font-bold tracking-widest uppercase pb-3 mb-4"
        style={{ borderTopColor: "var(--foreground)" }}
      >
        Comentarios ({comments.length})
      </h2>

      <CommentForm articleId={articleId} />

      {loading && comments.length === 0 ? (
        <p className="text-sm text-muted mt-4 text-center">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted mt-4 text-center">Todavía no hay comentarios. Sé el primero en comentar.</p>
      ) : (
        <div className="mt-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}