import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";

export const revalidate = 300;

export default async function InternacionalesPage() {
  const [apiArticles, ads, customArticles] = await Promise.all([
    fetchSectionArticles("internacionales"),
    getActiveAds(undefined, "internacionales"),
    getActiveArticles("internacionales"),
  ]);

  const sectionArticles = [...customArticles, ...(apiArticles ?? getArticlesBySection("internacionales"))];
  const leaderboardAd = pickAd(ads, "leaderboard");
  const inFeedAd = pickAd(ads, "infeed");

  return (
    <SectionPageLayout
      section="internacionales"
      articles={sectionArticles}
      subtitle="Noticias del mundo, relaciones internacionales y eventos globales."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAd={leaderboardAd}
      inFeedAd={inFeedAd}
    />
  );
}