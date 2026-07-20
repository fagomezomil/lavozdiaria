import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import ArticleDetail from "@/components/ArticleDetail";
import AdStickyFooter from "@/components/AdStickyFooter";
import { fetchSectionArticles, fetchBreakingNews } from "@/lib/api";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveAds } from "@/lib/ads";
import { getActiveArticles } from "@/lib/articles";
import { getSponsoredById, getActiveSponsored } from "@/lib/sponsored";
import { sectionConfig, Section, Article, SponsoredContent } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sponsored = await getSponsoredById(id);
  if (!sponsored) return { title: "Contenido no encontrado" };
  return {
    title: `${sponsored.title} - ¡QUE NOTICIA!`,
    description: sponsored.excerpt || sponsored.title,
  };
}

export default async function SponsoredDetailPage({ params }: PageProps) {
  const { id } = await params;

  const sponsored = await getSponsoredById(id);
  if (!sponsored) notFound();

  // Convert sponsored content to Article format for reuse
  const article = {
    id: sponsored.id,
    title: sponsored.title,
    subtitle: sponsored.subtitle,
    section: sponsored.section,
    author: sponsored.author ?? undefined,
    publisher: sponsored.publisher,
    date: sponsored.date,
    imageUrl: sponsored.imageUrl ?? undefined,
    imageAlt: sponsored.imageAlt,
    excerpt: sponsored.excerpt,
    body: sponsored.body ?? undefined,
    originalUrl: sponsored.originalUrl ?? undefined,
  };

  const sectionKey = sponsored.section as Section;
  const [sectionArticles, customRelated, breakingData, ads, otherSponsored] = await Promise.all([
    fetchSectionArticles(sectionKey),
    getActiveArticles(sectionKey),
    fetchBreakingNews(),
    getActiveAds(undefined, sectionKey),
    getActiveSponsored(sectionKey, undefined, true),
  ]);

  const related = [...customRelated, ...(sectionArticles ?? getArticlesBySection(sectionKey))].filter(
    (a) => a.id !== article.id,
  );

  const customBreaking = customRelated.filter((a) => a.breaking);
  const breaking = [...customBreaking, ...(breakingData ?? articles.filter((a) => a.breaking))];

  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const sidebarAds = ads.filter((a) => a.type === "sidebar");
  const stickyFooterAd = ads.find((a) => a.type === "sticky_footer") || null;

  // Other sponsored content for sidebar (excluding current one)
  const sponsoredSidebar: Article[] = otherSponsored
    .filter((s: SponsoredContent) => s.id !== sponsored!.id)
    .slice(0, 2)
    .map((s: SponsoredContent): Article => ({
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
    }));
  const sponsoredIds = new Set(sponsoredSidebar.map((s) => s.id));

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />
      <ArticleDetail article={article} related={related} leaderboardAds={leaderboardAds} sidebarAds={sidebarAds} isCustom isSponsored sponsoredSidebar={sponsoredSidebar} sponsoredIds={sponsoredIds} />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}