import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";

export const revalidate = 300;

export default async function InternacionalesPage() {
  const apiArticles = await fetchSectionArticles("internacionales");
  const sectionArticles = apiArticles ?? getArticlesBySection("internacionales");
  const ads = await getActiveAds();
  const leaderboardAd = ads.find((a) => a.type === "leaderboard");

  return (
    <SectionPageLayout
      section="internacionales"
      articles={sectionArticles}
      subtitle="Noticias del mundo, relaciones internacionales y eventos globales."
      allArticles={apiArticles ? [...articles, ...apiArticles] : articles}
      leaderboardAd={leaderboardAd}
    />
  );
}