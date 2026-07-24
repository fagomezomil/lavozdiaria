import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";
import { submitComment, reportComment, type CommentStatus } from "@/lib/actions/comments";

interface CommentsState {
  commentsByArticle: Record<string, Comment[]>;
  loading: Record<string, boolean>;

  fetchComments: (articleId: string) => Promise<void>;
  addComment: (articleId: string, content: string) => Promise<{ ok: boolean; error?: string; status?: CommentStatus }>;
  deleteComment: (commentId: string, articleId: string) => Promise<void>;
  reportCommentById: (commentId: string, reason: string) => Promise<{ ok: boolean; error?: string }>;
}

export const useCommentsStore = create<CommentsState>()((set, get) => ({
  commentsByArticle: {},
  loading: {},

  fetchComments: async (articleId: string) => {
    if (get().commentsByArticle[articleId]) return;

    set((s) => ({ loading: { ...s.loading, [articleId]: true } }));

    try {
      const supabase = createClient();
      // RLS expone: status='approved' + propios pending/flagged + admins ven todo
      const { data, error } = await supabase
        .from("comments")
        .select("id, article_id, user_id, content, created_at, status, toxicity_score, profiles!comments_user_id_fkey(full_name, avatar_url)")
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const comments: Comment[] = data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          article_id: row.article_id as string,
          user_id: (row.user_id as string) || null,
          user_name: ((row.profiles as Record<string, unknown>)?.full_name as string) || "Anónimo",
          user_avatar_url: ((row.profiles as Record<string, unknown>)?.avatar_url as string) || null,
          content: row.content as string,
          created_at: row.created_at as string,
          status: row.status as CommentStatus | undefined,
          toxicity_score: row.toxicity_score as number | null | undefined,
        }));

        set((s) => ({
          commentsByArticle: { ...s.commentsByArticle, [articleId]: comments },
          loading: { ...s.loading, [articleId]: false },
        }));
      } else {
        console.error("Error fetching comments:", error);
        set((s) => ({ loading: { ...s.loading, [articleId]: false } }));
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      set((s) => ({ loading: { ...s.loading, [articleId]: false } }));
    }
  },

  addComment: async (articleId: string, content: string) => {
    try {
      const result = await submitComment(articleId, content);

      if (!result.ok || !result.comment) {
        return { ok: false, error: result.error };
      }

      const newComment: Comment = {
        id: result.comment.id,
        article_id: result.comment.article_id,
        user_id: result.comment.user_id,
        user_name: result.comment.user_name,
        user_avatar_url: result.comment.user_avatar_url,
        content: result.comment.content,
        created_at: result.comment.created_at,
        status: result.comment.status,
        toxicity_score: result.comment.toxicity_score,
      };

      set((s) => ({
        commentsByArticle: {
          ...s.commentsByArticle,
          [articleId]: [...(s.commentsByArticle[articleId] || []), newComment],
        },
      }));

      return { ok: true, status: result.status };
    } catch (err) {
      console.error("Error adding comment:", err);
      return { ok: false, error: "Error inesperado al enviar" };
    }
  },

  deleteComment: async (commentId: string, articleId: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only allow deleting own comments — admins use the server action
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting comment:", error);
        return;
      }

      set((s) => ({
        commentsByArticle: {
          ...s.commentsByArticle,
          [articleId]: (s.commentsByArticle[articleId] || []).filter((c) => c.id !== commentId),
        },
      }));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  },

  reportCommentById: async (commentId: string, reason: string) => {
    try {
      const result = await reportComment(commentId, reason);
      return { ok: result.ok, error: result.error };
    } catch (err) {
      console.error("Error reporting comment:", err);
      return { ok: false, error: "Error inesperado al reportar" };
    }
  },
}));