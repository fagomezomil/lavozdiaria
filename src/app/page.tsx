import Link from "next/link";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import AdRotator from "@/components/AdRotator";
import AdInFeed from "@/components/AdInFeed";
import AdModal from "@/components/AdModal";
import AdStickyFooter from "@/components/AdStickyFooter";
import Footer from "@/components/Footer";
import AnimateIn from "@/components/animate/AnimateIn";
import AnimateStagger from "@/components/animate/AnimateStagger";
import StaggerItem from "@/components/animate/StaggerItem";
import HeroEditorial from "@/components/HeroEditorial";
import { sectionConfig } from "@/lib/types";
import type { Section, Article, SponsoredContent } from "@/lib/types";
import { articles as seedArticles, getArticlesBySection } from "@/lib/data";
import {
  fetchBreakingNews,
  fetchHomepageArticles,
} from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getActiveArticles } from "@/lib/articles";
import { getActiveSponsored } from "@/lib/sponsored";
import { fetchCurrentWeather } from "@/lib/weather";
import WeatherStrip from "@/components/WeatherStrip";

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

export const revalidate = 60;

export default async function Home() {
  const [breakingData, sectionData, ads, customArticles, sponsoredContent, weather] = await Promise.all([
    fetchBreakingNews(),
    fetchHomepageArticles(),
    getActiveAds(),
    getActiveArticles(),
    getActiveSponsored(undefined, true),
    fetchCurrentWeather(),
  ]);

  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const rectangleAds = ads.filter((a) => a.type === "rectangle");
  const modalAd = pickAd(ads, "modal");
  const stickyFooterAd = pickAd(ads, "sticky_footer");

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
  // 1 sponsored per section for homepage (as 3rd item)
  const sponsoredPerSection: Record<Section, Article | null> = {} as Record<Section, Article | null>;
  const sponsoredIds = new Set<string>();
  for (const key of Object.keys(sectionConfig) as Section[]) {
    const custom = customArticles.filter((a) => a.section === key && !a.breaking);
    const firstSponsored = sponsoredContent.find((s) => s.section === key);
    if (firstSponsored) {
      sponsoredIds.add(firstSponsored.id);
      sponsoredPerSection[key] = sponsoredToArticle(firstSponsored);
    } else {
      sponsoredPerSection[key] = null;
    }
    sectionArticles[key] = [...custom, ...apiSectionArticles[key]];
  }

  // Flatten all articles for hero/sidebar logic
  const allArticles = Object.values(sectionArticles).flat();
  // Pick 1 article per section for the hero slider (5 sections = 5 slides)
  const sliderArticles: Article[] = (Object.keys(sectionConfig) as Section[])
    .map((key) => sectionArticles[key]?.[0])
    .filter((a): a is Article => !!a);
  const hero = allArticles.find((a) => a.featured) ?? allArticles[0];
  const secondary = allArticles.filter(
    (a) => hero && a.id !== hero.id && a.featured
  );
  const sidebar = allArticles
    .filter((a) => hero && a.id !== hero.id && !a.featured)
    .slice(0, 5);

  // Urgente articles from all sections (cross-section)
  const urgentArticles = allArticles.filter((a) => a.layout === "urgente");

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />

      {/* Leaderboard ad */}
      <AdRotator ads={leaderboardAds} size="leaderboard" className="max-w-7xl mx-auto my-4" />

      <main className="max-w-7xl mx-auto pb-4">
        {/* Urgente articles — full-width red alerts */}
        {urgentArticles.length > 0 && (
          <div className="mb-8 space-y-4">
            {urgentArticles.map((a) => (
              <ArticleCard key={a.id} article={a} variant="urgente" />
            ))}
          </div>
        )}

        {/* Hero Editorial */}
        <AnimateIn direction="up">
          <HeroEditorial articles={sliderArticles} />
        </AnimateIn>

        <div className="rule my-10" />

        {/* Leaderboard ad */}
        <AnimateIn delay={0.1}>
          <AdRotator ads={leaderboardAds} size="leaderboard" className="mb-10" />
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
        {Object.entries(sectionConfig).map(([key, cfg], index) => {
          const sArticles = sectionArticles[key as Section];
          if (!sArticles || sArticles.length === 0) return null;
          const sponsoredItem = sponsoredPerSection[key as Section];

          // First article is featured (larger), rest are standard
          const featured = sArticles[0];
          const rest = sArticles.slice(1);

          return (
            <AnimateIn key={key} direction="up" delay={0.1}>
              <section className="mb-10">
                <div
                  className="border-t-2 pt-2 mb-4 flex items-center justify-between"
                  style={{ borderTopColor: cfg.color }}
                >
                  <h2
                    className="text-sm font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </h2>
                  <Link
                    href={cfg.path}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: cfg.color }}
                  >
                    +{cfg.label}
                  </Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Featured article — spans 2 columns */}
                  <div className="lg:col-span-2">
                    <ArticleCard article={featured} variant="featured" />
                  </div>
                  {/* Side stack: sponsored or 2nd article + 1 more */}
                  <div className="flex flex-col gap-6">
                    {sponsoredItem ? (
                      <>
                        <ArticleCard article={sponsoredItem} variant="standard" sponsored />
                        {rest.slice(0, 1).map((a) => (
                          <ArticleCard key={a.id} article={a} variant="compact" />
                        ))}
                      </>
                    ) : (
                      rest.slice(0, 2).map((a) => (
                        <ArticleCard key={a.id} article={a} variant="compact" />
                      ))
                    )}
                  </div>
                </div>
              </section>

              {/* Rectangle ads row after Deportes (index 1) */}
              {index === 1 && (
                <div className="border-t border-border pt-6 mt-2 mb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AdRotator ads={rectangleAds} size="rectangle" />
                    <div className="hidden sm:block">
                      <AdRotator ads={rectangleAds} size="rectangle" />
                    </div>
                    <div className="hidden lg:block">
                      <AdRotator ads={rectangleAds} size="rectangle" />
                    </div>
                  </div>
                </div>
              )}

              {/* Weather strip after Economia (index 2) */}
              {index === 2 && (
                <div className="mb-10">
                  <WeatherStrip weather={weather} />
                </div>
              )}
            </AnimateIn>
          );
        })}

        {/* Bottom leaderboard ad */}
        <AnimateIn direction="up" delay={0.1}>
          <AdRotator ads={leaderboardAds} size="leaderboard" className="mb-10" />
        </AnimateIn>
      </main>

      <Footer />
      <AdModal ad={modalAd} />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}