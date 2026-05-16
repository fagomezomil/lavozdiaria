import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import ArticleDetail from "@/components/ArticleDetail";
import AdStickyFooter from "@/components/AdStickyFooter";
import { fetchArticleDetail, fetchSectionArticles, fetchBreakingNews } from "@/lib/api";
import { getArticleById as getSeedArticleById, getArticlesBySection, articles } from "@/lib/data";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getArticleById as getCustomArticleById, getActiveArticles } from "@/lib/articles";
import { sectionConfig, Section } from "@/lib/types";

interface PageProps {
  params: Promise<{ section: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const customArticle = await getCustomArticleById(id);
  const article = customArticle ?? await fetchArticleDetail(id) ?? getSeedArticleById(id);
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

  // Check custom articles first, then API, then seed data
  const customArticle = await getCustomArticleById(id);
  const article = customArticle ?? await fetchArticleDetail(id) ?? getSeedArticleById(id);
  if (!article) notFound();

  const sectionKey = article.section as Section;
  const [sectionArticles, customRelated, breakingData, ads] = await Promise.all([
    fetchSectionArticles(sectionKey),
    getActiveArticles(sectionKey),
    fetchBreakingNews(),
    getActiveAds(undefined, sectionKey),
  ]);

  const related = [...customRelated, ...(sectionArticles ?? getArticlesBySection(sectionKey))].filter(
    (a) => a.id !== article.id,
  );

  // Merge custom breaking with API breaking
  const customBreaking = customRelated.filter((a) => a.breaking);
  const breaking = [...customBreaking, ...(breakingData ?? articles.filter((a) => a.breaking))];

  const leaderboardAd = pickAd(ads, "leaderboard");
  const sidebarAd = pickAd(ads, "sidebar");
  const stickyFooterAd = pickAd(ads, "sticky_footer");

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />
      <ArticleDetail article={article} related={related} leaderboardAd={leaderboardAd} sidebarAd={sidebarAd} isCustom={!!customArticle} />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}