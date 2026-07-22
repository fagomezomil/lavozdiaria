import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import AdStickyFooter from "@/components/AdStickyFooter";
import OpinionArchiveLayout from "@/components/OpinionArchiveLayout";
import { fetchBreakingNews } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getActiveArticles } from "@/lib/articles";
import { getActiveColumnists } from "@/lib/columnists";
import { getActiveSponsored } from "@/lib/sponsored";
import { articles } from "@/lib/data";
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

export const revalidate = 300;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function OpinionPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Opinion is manual-only — no FreeNewsApi, no scraper.
  const [ads, customArticles, sponsoredContent, columnists, breakingData] = await Promise.all([
    getActiveAds(undefined, "opinion"),
    getActiveArticles("opinion"),
    getActiveSponsored("opinion"),
    getActiveColumnists(),
    fetchBreakingNews(),
  ]);

  // getActiveArticles already orders by sort_date desc
  const sponsoredAsArticles = sponsoredContent.map(sponsoredToArticle);
  const allItems = [...customArticles, ...sponsoredAsArticles];

  const breaking = breakingData ?? articles.filter((a) => a.breaking);
  const stickyFooterAd = ads.find((a) => a.type === "sticky_footer") || null;
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const sidebarAds = ads.filter((a) => a.type === "sidebar");
  // Top y bottom: si hay 1 solo, va arriba. Si hay 2+, uno arriba y otro abajo.
  const leaderboardTop = leaderboardAds[0] || null;
  const leaderboardBottom = leaderboardAds.length > 1 ? leaderboardAds[1] : null;

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />
      <OpinionArchiveLayout
        articles={allItems}
        columnists={columnists}
        page={page}
        leaderboardTop={leaderboardTop}
        leaderboardBottom={leaderboardBottom}
        sidebarAds={sidebarAds}
      />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}