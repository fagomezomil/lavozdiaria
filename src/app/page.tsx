import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import AdInFeed from "@/components/AdInFeed";
import AdModal from "@/components/AdModal";
import AdStickyFooter from "@/components/AdStickyFooter";
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
import { getActiveAds, pickAd, pickAds } from "@/lib/ads";
import { getActiveArticles } from "@/lib/articles";

export const revalidate = 60;

export default async function Home() {
  const [breakingData, sectionData, ads, customArticles] = await Promise.all([
    fetchBreakingNews(),
    fetchHomepageArticles(),
    getActiveAds(),
    getActiveArticles(),
  ]);

  const [leaderboard1, leaderboard2] = pickAds(ads, "leaderboard", 2);
  const rectangleAd = pickAd(ads, "rectangle");
  const modalAd = pickAd(ads, "modal");
  const stickyFooterAd = pickAd(ads, "sticky_footer");
  const inFeedAd = pickAd(ads, "infeed");

  // Merge custom breaking news with API breaking news
  const customBreaking = customArticles.filter((a) => a.breaking);
  const apiBreaking = breakingData ?? seedArticles.filter((a) => a.breaking);
  const breaking = [...customBreaking, ...apiBreaking];

  // Build section articles: custom first, then API/seed
  const apiSectionArticles: Record<Section, Article[]> = sectionData ?? {
    politica: getArticlesBySection("politica"),
    deportes: getArticlesBySection("deportes"),
    economia: getArticlesBySection("economia"),
    internacionales: getArticlesBySection("internacionales"),
    tucuman: getArticlesBySection("tucuman"),
  };

  const sectionArticles: Record<Section, Article[]> = {} as Record<Section, Article[]>;
  for (const key of Object.keys(sectionConfig) as Section[]) {
    const custom = customArticles.filter((a) => a.section === key && !a.breaking);
    sectionArticles[key] = [...custom, ...apiSectionArticles[key]];
  }

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

        {/* Rectangle ad */}
        {rectangleAd && (
          <div className="flex justify-center mb-10">
            <AdSlot size="rectangle" ad={rectangleAd} />
          </div>
        )}

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
                  {sArticles.slice(0, 2).map((a) => (
                    <StaggerItem key={a.id}>
                      <ArticleCard article={a} variant="standard" />
                    </StaggerItem>
                  ))}
                  {inFeedAd && sArticles.length >= 2 && (
                    <StaggerItem>
                      <AdInFeed ad={inFeedAd} />
                    </StaggerItem>
                  )}
                  {sArticles.slice(2, 3).map((a) => (
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
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}