import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";

export const revalidate = 300;

export default async function TucumanPage() {
  const [apiArticles, ads, customArticles] = await Promise.all([
    fetchSectionArticles("tucuman"),
    getActiveAds(undefined, "tucuman"),
    getActiveArticles("tucuman"),
  ]);

  const sectionArticles = [...customArticles, ...(apiArticles ?? getArticlesBySection("tucuman"))];
  const leaderboardAd = pickAd(ads, "leaderboard");
  const inFeedAd = pickAd(ads, "infeed");

  return (
    <SectionPageLayout
      section="tucuman"
      articles={sectionArticles}
      subtitle="Noticias de la provincia de Tucumán y la región del NOA."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAd={leaderboardAd}
      inFeedAd={inFeedAd}
    />
  );
}