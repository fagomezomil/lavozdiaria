import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";

export const revalidate = 300;

export default async function EconomiaPage() {
  const [apiArticles, ads, customArticles] = await Promise.all([
    fetchSectionArticles("economia"),
    getActiveAds(undefined, "economia"),
    getActiveArticles("economia"),
  ]);

  const sectionArticles = [...customArticles, ...(apiArticles ?? getArticlesBySection("economia"))];
  const leaderboardAd = pickAd(ads, "leaderboard");
  const inFeedAd = pickAd(ads, "infeed");

  return (
    <SectionPageLayout
      section="economia"
      articles={sectionArticles}
      subtitle="Mercados, finanzas y tendencias económicas."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAd={leaderboardAd}
      inFeedAd={inFeedAd}
    />
  );
}