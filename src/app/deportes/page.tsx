import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";

export const revalidate = 300;

export default async function DeportesPage() {
  const [apiArticles, ads, customArticles] = await Promise.all([
    fetchSectionArticles("deportes"),
    getActiveAds(undefined, "deportes"),
    getActiveArticles("deportes"),
  ]);

  const sectionArticles = [...customArticles, ...(apiArticles ?? getArticlesBySection("deportes"))];
  const leaderboardAd = pickAd(ads, "leaderboard");
  const inFeedAd = pickAd(ads, "infeed");

  return (
    <SectionPageLayout
      section="deportes"
      articles={sectionArticles}
      subtitle="Resultados, crónicas y análisis del mundo deportivo."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAd={leaderboardAd}
      inFeedAd={inFeedAd}
    />
  );
}