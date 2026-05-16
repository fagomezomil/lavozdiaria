import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import type { LocalArticleData } from "@/lib/store/likes";

interface FavoriteState {
  /** All favorited article IDs (DB + local) */
  favoritedIds: string[];
  /** Article data for API/seed articles favorited locally */
  localArticles: LocalArticleData[];
  initialized: boolean;

  initialize: (userId: string) => Promise<void>;
  toggleFavorite: (articleId: string, isCustom: boolean, articleData?: LocalArticleData) => Promise<void>;
  isFavorited: (articleId: string) => boolean;
}

export const useFavoritesStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favoritedIds: [],
      localArticles: [],
      initialized: false,

      initialize: async (userId: string) => {
        if (get().initialized) return;

        const supabase = createClient();
        const { data: dbFavorites } = await supabase
          .from("favorites")
          .select("article_id")
          .eq("user_id", userId);

        const dbIds = dbFavorites?.map((f) => f.article_id) ?? [];
        const localIds = get().favoritedIds;

        const merged = [...new Set([...dbIds, ...localIds])];
        set({ favoritedIds: merged, initialized: true });
      },

      toggleFavorite: async (articleId: string, isCustom: boolean, articleData?: LocalArticleData) => {
        const { favoritedIds, localArticles } = get();
        const isFavorited = favoritedIds.includes(articleId);

        if (isCustom) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (isFavorited) {
            await supabase.from("favorites").delete().eq("user_id", user.id).eq("article_id", articleId);
            set({ favoritedIds: favoritedIds.filter((id) => id !== articleId) });
          } else {
            await supabase.from("favorites").insert({ user_id: user.id, article_id: articleId });
            set({ favoritedIds: [...favoritedIds, articleId] });
          }
        } else {
          if (isFavorited) {
            set({
              favoritedIds: favoritedIds.filter((id) => id !== articleId),
              localArticles: localArticles.filter((a) => a.id !== articleId),
            });
          } else {
            if (articleData) {
              set({
                favoritedIds: [...favoritedIds, articleId],
                localArticles: [...localArticles, articleData],
              });
            } else {
              set({ favoritedIds: [...favoritedIds, articleId] });
            }
          }
        }
      },

      isFavorited: (articleId: string) => get().favoritedIds.includes(articleId),
    }),
    {
      name: "lv-favorites",
      partialize: (state) =>
        ({
          favoritedIds: state.favoritedIds,
          localArticles: state.localArticles,
        }) as unknown as FavoriteState,
    },
  ),
);