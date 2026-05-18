import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";
import { getActiveSponsored } from "@/lib/sponsored";
import type { Article, SponsoredContent } from "@/lib/types";

function sponsoredToArticle(s: SponsoredContent): Article {
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    section: s.section,
    author: s.author ?? undefined,
    publisher: s.publisher,
    date: s.date,
    imageUrl: s.imageUrl ?? undefined,
    imageAlt: s.imageAlt,
    excerpt: s.excerpt,
    body: s.body ?? undefined,
    originalUrl: s.originalUrl ?? undefined,
  };
}

function interleaveSponsored(articles: Article[], sponsored: Article[]): Article[] {
  if (sponsored.length === 0) return articles;
  const result = [...articles];
  const interval = Math.max(2, Math.floor(result.length / (sponsored.length + 1)));
  sponsored.forEach((s, i) => {
    const pos = Math.min(interval * (i + 1) + i, result.length);
    result.splice(pos, 0, s);
  });
  return result;
}

export const revalidate = 300;

export default async function DeportesPage() {
  const [apiArticles, ads, customArticles, sponsoredContent] = await Promise.all([
    fetchSectionArticles("deportes"),
    getActiveAds(undefined, "deportes"),
    getActiveArticles("deportes"),
    getActiveSponsored("deportes"),
  ]);

  const sponsoredIds = new Set(sponsoredContent.map((s) => s.id));
  const sectionArticles = interleaveSponsored(
    [...customArticles, ...(apiArticles ?? getArticlesBySection("deportes"))],
    sponsoredContent.map(sponsoredToArticle),
  );
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
      sponsoredIds={sponsoredIds}
    />
  );
}