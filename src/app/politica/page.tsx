import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";

export const revalidate = 300;

export default async function PoliticaPage() {
  const [apiArticles, ads, customArticles] = await Promise.all([
    fetchSectionArticles("politica"),
    getActiveAds(undefined, "politica"),
    getActiveArticles("politica"),
  ]);

  const sectionArticles = [...customArticles, ...(apiArticles ?? getArticlesBySection("politica"))];
  const leaderboardAd = pickAd(ads, "leaderboard");
  const inFeedAd = pickAd(ads, "infeed");

  return (
    <SectionPageLayout
      section="politica"
      articles={sectionArticles}
      subtitle="Las noticias más relevantes del ámbito político nacional e internacional."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAd={leaderboardAd}
      inFeedAd={inFeedAd}
    />
  );
}