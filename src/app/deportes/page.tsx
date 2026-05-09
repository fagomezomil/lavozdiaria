import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";

export const revalidate = 300;

export default async function DeportesPage() {
  const apiArticles = await fetchSectionArticles("deportes");
  const sectionArticles = apiArticles ?? getArticlesBySection("deportes");
  const ads = await getActiveAds();
  const leaderboardAd = ads.find((a) => a.type === "leaderboard");

  return (
    <SectionPageLayout
      section="deportes"
      articles={sectionArticles}
      subtitle="Resultados, crónicas y análisis del mundo deportivo."
      allArticles={apiArticles ? [...articles, ...apiArticles] : articles}
      leaderboardAd={leaderboardAd}
    />
  );
}