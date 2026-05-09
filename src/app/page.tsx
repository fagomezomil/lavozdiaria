import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import AdModal from "@/components/AdModal";
import Footer from "@/components/Footer";
import AnimateIn from "@/components/animate/AnimateIn";
import AnimateStagger from "@/components/animate/AnimateStagger";
import StaggerItem from "@/components/animate/StaggerItem";
import HeroSlider from "@/components/HeroSlider";
import { sectionConfig } from "@/lib/types";
import type { Section, Article } from "@/lib/types";
import { articles as seedArticles, getArticlesBySection } from "@/lib/data";
import {
  fetchBreakingNews,
  fetchHomepageArticles,
} from "@/lib/api";
import { getActiveAds } from "@/lib/ads";

export const revalidate = 60;

export default async function Home() {
  const [breakingData, sectionData, ads] = await Promise.all([
    fetchBreakingNews(),
    fetchHomepageArticles(),
    getActiveAds(),
  ]);

  const leaderboard1 = ads.find((a) => a.type === "leaderboard");
  const leaderboard2 = ads.find((a) => a.type === "leaderboard" && a.id !== leaderboard1?.id);
  const rectangleAd = ads.find((a) => a.type === "rectangle");
  const modalAd = ads.find((a) => a.type === "modal");

  const breaking = breakingData ?? seedArticles.filter((a) => a.breaking);
  const sectionArticles: Record<Section, Article[]> = sectionData ?? {
    politica: getArticlesBySection("politica"),
    deportes: getArticlesBySection("deportes"),
    economia: getArticlesBySection("economia"),
    internacionales: getArticlesBySection("internacionales"),
    tucuman: getArticlesBySection("tucuman"),
  };

  // Flatten all articles for hero/sidebar logic
  const allArticles = Object.values(sectionArticles).flat();
  const hero = allArticles.find((a) => a.featured) ?? allArticles[0];
  const secondary = allArticles.filter(
    (a) => hero && a.id !== hero.id && a.featured
  );
  const sidebar = allArticles
    .filter((a) => hero && a.id !== hero.id && !a.featured)
    .slice(0, 5);

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />

      {/* Leaderboard ad */}
      <AdSlot size="leaderboard" className="max-w-7xl mx-auto my-4" ad={leaderboard1} />

      <main className="max-w-7xl mx-auto pb-4">
        {/* Hero Slider */}
        <AnimateIn direction="up">
          <HeroSlider articles={allArticles.slice(0, 5)} interval={6000} />
        </AnimateIn>

        <div className="rule my-10" />

        {/* Leaderboard ad */}
        <AnimateIn delay={0.1}>
          <AdSlot size="leaderboard" className="mb-10" ad={leaderboard2} />
        </AnimateIn>

        {/* Secondary featured */}
        <AnimateStagger className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {secondary.map((a) => (
            <StaggerItem key={a.id}>
              <ArticleCard article={a} variant="standard" />
            </StaggerItem>
          ))}
        </AnimateStagger>

        {/* Section grids */}
        {Object.entries(sectionConfig).map(([key, cfg]) => {
          const sArticles = sectionArticles[key as Section];
          if (!sArticles || sArticles.length === 0) return null;

          return (
            <AnimateIn key={key} direction="up" delay={0.1}>
              <section className="mb-10">
                <div
                  className="border-t-4 pt-2 mb-4"
                  style={{ borderTopColor: cfg.color }}
                >
                  <h2
                    className="text-lg font-bold tracking-wide uppercase font-[family-name:var(--font-heading)]"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </h2>
                </div>
                <AnimateStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sArticles.slice(0, 3).map((a) => (
                    <StaggerItem key={a.id}>
                      <ArticleCard article={a} variant="standard" />
                    </StaggerItem>
                  ))}
                </AnimateStagger>
              </section>
            </AnimateIn>
          );
        })}
      </main>

      <Footer />
      <AdModal ad={modalAd} />
    </>
  );
}