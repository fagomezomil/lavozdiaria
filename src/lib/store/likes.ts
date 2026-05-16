import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import type { Article } from "@/lib/types";

/** Minimal article data stored locally for API/seed articles */
export interface LocalArticleData {
  id: string;
  title: string;
  section: string;
  imageUrl?: string;
  date: string;
}

interface LikeState {
  /** All liked article IDs (DB + local) */
  likedIds: string[];
  /** Article data for API/seed articles liked locally */
  localArticles: LocalArticleData[];
  initialized: boolean;

  initialize: (userId: string) => Promise<void>;
  toggleLike: (articleId: string, isCustom: boolean, articleData?: LocalArticleData) => Promise<void>;
  isLiked: (articleId: string) => boolean;
}

export const useLikesStore = create<LikeState>()(
  persist(
    (set, get) => ({
      likedIds: [],
      localArticles: [],
      initialized: false,

      initialize: async (userId: string) => {
        if (get().initialized) return;

        // Fetch likes from DB for custom articles
        const supabase = createClient();
        const { data: dbLikes } = await supabase
          .from("likes")
          .select("article_id")
          .eq("user_id", userId);

        const dbIds = dbLikes?.map((l) => l.article_id) ?? [];
        const localIds = get().likedIds;

        // Merge: DB ids + local ids (avoid duplicates)
        const merged = [...new Set([...dbIds, ...localIds])];
        set({ likedIds: merged, initialized: true });
      },

      toggleLike: async (articleId: string, isCustom: boolean, articleData?: LocalArticleData) => {
        const { likedIds, localArticles } = get();
        const isLiked = likedIds.includes(articleId);

        if (isCustom) {
          // Toggle in DB
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (isLiked) {
            await supabase.from("likes").delete().eq("user_id", user.id).eq("article_id", articleId);
            set({ likedIds: likedIds.filter((id) => id !== articleId) });
          } else {
            await supabase.from("likes").insert({ user_id: user.id, article_id: articleId });
            set({ likedIds: [...likedIds, articleId] });
          }
        } else {
          // Toggle in local state (persisted via localStorage)
          if (isLiked) {
            set({
              likedIds: likedIds.filter((id) => id !== articleId),
              localArticles: localArticles.filter((a) => a.id !== articleId),
            });
          } else {
            if (articleData) {
              set({
                likedIds: [...likedIds, articleId],
                localArticles: [...localArticles, articleData],
              });
            } else {
              set({ likedIds: [...likedIds, articleId] });
            }
          }
        }
      },

      isLiked: (articleId: string) => get().likedIds.includes(articleId),
    }),
    {
      name: "lv-likes",
      // Only persist local articles data, not DB ids (those are fetched fresh)
      partialize: (state) =>
        ({
          likedIds: state.likedIds,
          localArticles: state.localArticles,
        }) as unknown as LikeState,
    },
  ),
);