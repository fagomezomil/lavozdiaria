import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import ArticleDetail from "@/components/ArticleDetail";
import { fetchArticleDetail, fetchSectionArticles, fetchBreakingNews } from "@/lib/api";
import { getArticleById, getArticlesBySection, articles } from "@/lib/data";
import { getActiveAds } from "@/lib/ads";
import { sectionConfig, Section } from "@/lib/types";

interface PageProps {
  params: Promise<{ section: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchArticleDetail(id) ?? getArticleById(id);
  if (!article) return { title: "Artículo no encontrado" };
  return {
    title: `${article.title} - LaVozDiaria`,
    description: article.excerpt || article.title,
  };
}

export async function generateStaticParams() {
  return articles.map((a) => ({
    section: a.section,
    id: a.id,
  }));
}

export default async function ArticlePage({ params }: PageProps) {
  const { section, id } = await params;

  if (!(section in sectionConfig)) notFound();

  const article = await fetchArticleDetail(id) ?? getArticleById(id);
  if (!article) notFound();

  const sectionKey = article.section as Section;
  const sectionArticles = await fetchSectionArticles(sectionKey);
  const related = (sectionArticles ?? getArticlesBySection(sectionKey)).filter(
    (a) => a.id !== article.id,
  );

  // Collect breaking news
  const breakingData = await fetchBreakingNews();
  const breaking = breakingData ?? articles.filter((a) => a.breaking);

  // Fetch ads
  const ads = await getActiveAds();
  const leaderboardAd = ads.find((a) => a.type === "leaderboard");
  const sidebarAd = ads.find((a) => a.type === "sidebar");

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />
      <ArticleDetail article={article} related={related} leaderboardAd={leaderboardAd} sidebarAd={sidebarAd} />
      <Footer />
    </>
  );
}