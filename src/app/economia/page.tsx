import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";

export const revalidate = 300;

export default async function EconomiaPage() {
  const apiArticles = await fetchSectionArticles("economia");
  const sectionArticles = apiArticles ?? getArticlesBySection("economia");
  const ads = await getActiveAds();
  const leaderboardAd = ads.find((a) => a.type === "leaderboard");

  return (
    <SectionPageLayout
      section="economia"
      articles={sectionArticles}
      subtitle="Mercados, finanzas y tendencias económicas."
      allArticles={apiArticles ? [...articles, ...apiArticles] : articles}
      leaderboardAd={leaderboardAd}
    />
  );
}