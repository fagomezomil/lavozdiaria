import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";

export const revalidate = 300;

export default async function PoliticaPage() {
  const apiArticles = await fetchSectionArticles("politica");
  const sectionArticles = apiArticles ?? getArticlesBySection("politica");
  const ads = await getActiveAds();
  const leaderboardAd = ads.find((a) => a.type === "leaderboard");

  return (
    <SectionPageLayout
      section="politica"
      articles={sectionArticles}
      subtitle="Las noticias más relevantes del ámbito político nacional e internacional."
      allArticles={apiArticles ? [...articles, ...apiArticles] : articles}
      leaderboardAd={leaderboardAd}
    />
  );
}