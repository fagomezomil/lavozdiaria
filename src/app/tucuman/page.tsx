import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";

export const revalidate = 300;

export default async function TucumanPage() {
  const apiArticles = await fetchSectionArticles("tucuman");
  const sectionArticles = apiArticles ?? getArticlesBySection("tucuman");
  const ads = await getActiveAds();
  const leaderboardAd = ads.find((a) => a.type === "leaderboard");

  return (
    <SectionPageLayout
      section="tucuman"
      articles={sectionArticles}
      subtitle="Noticias de la provincia de Tucumán y la región del NOA."
      allArticles={apiArticles ? [...articles, ...apiArticles] : articles}
      leaderboardAd={leaderboardAd}
    />
  );
}