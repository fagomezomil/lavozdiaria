import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";

interface CommentsState {
  commentsByArticle: Record<string, Comment[]>;
  loading: Record<string, boolean>;

  fetchComments: (articleId: string) => Promise<void>;
  addComment: (articleId: string, content: string) => Promise<boolean>;
  deleteComment: (commentId: string, articleId: string) => Promise<void>;
}

export const useCommentsStore = create<CommentsState>()((set, get) => ({
  commentsByArticle: {},
  loading: {},

  fetchComments: async (articleId: string) => {
    if (get().commentsByArticle[articleId]) return;

    set((s) => ({ loading: { ...s.loading, [articleId]: true } }));

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select("id, article_id, user_id, content, created_at, profiles!comments_user_id_fkey(full_name, avatar_url)")
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("comments")
        .insert({ article_id: articleId, user_id: user.id, content })
        .select("id, article_id, user_id, content, created_at, profiles!comments_user_id_fkey(full_name, avatar_url)")
        .single();

      if (error || !data) {
        console.error("Error adding comment:", error);
        return false;
      }

      const profileData = data.profiles as unknown as Record<string, unknown>;
      const newComment: Comment = {
        id: data.id as string,
        article_id: data.article_id as string,
        user_id: (data.user_id as string) || null,
        user_name: (profileData?.full_name as string) || user?.email || "Anónimo",
        user_avatar_url: (profileData?.avatar_url as string) || null,
        content: data.content as string,
        created_at: data.created_at as string,
      };

      set((s) => ({
        commentsByArticle: {
          ...s.commentsByArticle,
          [articleId]: [...(s.commentsByArticle[articleId] || []), newComment],
        },
      }));

      return true;
    } catch (err) {
      console.error("Error adding comment:", err);
      return false;
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
}));