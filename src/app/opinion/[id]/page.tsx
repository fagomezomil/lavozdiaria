import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import AdStickyFooter from "@/components/AdStickyFooter";
import OpinionArticleDetail from "@/components/OpinionArticleDetail";
import { fetchBreakingNews } from "@/lib/api";
import { getArticleById, getActiveArticles } from "@/lib/articles";
import { getColumnistById } from "@/lib/columnists";
import { getActiveAds } from "@/lib/ads";
import { articles } from "@/lib/data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article || article.section !== "opinion") return { title: "Artículo no encontrado" };
  return {
    title: `${article.title} - ¡QUE NOTICIA!`,
    description: article.excerpt || article.subtitle || article.title,
  };
}

export default async function OpinionArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article || article.section !== "opinion") notFound();

  const columnist = article.columnistId
    ? await getColumnistById(article.columnistId)
    : undefined;

  const [breakingData, ads, allOpinion] = await Promise.all([
    fetchBreakingNews(),
    getActiveAds(undefined, "opinion"),
    getActiveArticles("opinion"),
  ]);

  const breaking = breakingData ?? articles.filter((a) => a.breaking);
  const stickyFooterAd = ads.find((a) => a.type === "sticky_footer") || null;
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const sidebarAds = ads.filter((a) => a.type === "sidebar");
  const leaderboardTop = leaderboardAds[0] || null;
  const leaderboardBottom = leaderboardAds.length > 1 ? leaderboardAds[1] : null;
  // Más opiniones: excluir la nota actual, hasta 6
  const moreOpinion = allOpinion.filter((a) => a.id !== article.id).slice(0, 6);

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />
      <OpinionArticleDetail
        article={article}
        columnist={columnist ?? undefined}
        isCustom
        leaderboardTop={leaderboardTop}
        leaderboardBottom={leaderboardBottom}
        sidebarAds={sidebarAds}
        moreOpinion={moreOpinion}
      />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}