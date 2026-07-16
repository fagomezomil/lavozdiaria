import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
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

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function InternacionalesPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [apiArticles, ads, customArticles, sponsoredContent] = await Promise.all([
    fetchSectionArticles("internacionales"),
    getActiveAds(undefined, "internacionales"),
    getActiveArticles("internacionales"),
    getActiveSponsored("internacionales"),
  ]);

  const sponsoredIds = new Set(sponsoredContent.map((s) => s.id));
  const sectionArticles = interleaveSponsored(
    [...customArticles, ...(apiArticles ?? getArticlesBySection("internacionales"))],
    sponsoredContent.map(sponsoredToArticle),
  );
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const rectangleAds = ads.filter((a) => a.type === "rectangle");

  return (
    <SectionPageLayout
      section="internacionales"
      articles={sectionArticles}
      subtitle="Noticias del mundo, relaciones internacionales y eventos globales."
      allArticles={apiArticles ? [...customArticles, ...articles, ...apiArticles] : [...customArticles, ...articles]}
      leaderboardAds={leaderboardAds}
      rectangleAds={rectangleAds}
      sponsoredIds={sponsoredIds}
      page={page}
    />
  );
}