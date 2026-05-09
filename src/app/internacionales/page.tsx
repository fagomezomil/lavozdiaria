import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";

export const revalidate = 300;

export default async function InternacionalesPage() {
  const [apiArticles, ads, customArticles] = await Promise.all([
    fetchSectionArticles("internacionales"),
    getActiveAds(),
    getActiveArticles("internacionales"),
  ]);

  const sectionArticles = [...customArticles, ...(apiArticles ?? getArticlesBySection("internacionales"))];
  const leaderboardAd = ads.find((a) => a.type === "leaderboard");

  return (
    <SectionPageLayout
      section="internacionales"
      articles={sectionArticles}
      subtitle="Noticias del mundo, relaciones internacionales y eventos globales."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAd={leaderboardAd}
    />
  );
}