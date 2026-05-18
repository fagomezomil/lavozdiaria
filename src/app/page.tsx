import Link from "next/link";
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
import type { Section, Article, SponsoredContent } from "@/lib/types";
import { articles as seedArticles, getArticlesBySection } from "@/lib/data";
import {
  fetchBreakingNews,
  fetchHomepageArticles,
} from "@/lib/api";
import { getActiveAds, pickAd, pickAds } from "@/lib/ads";
import { getActiveArticles } from "@/lib/articles";
import { getActiveSponsored } from "@/lib/sponsored";

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
  const [breakingData, sectionData, ads, customArticles, sponsoredContent] = await Promise.all([
    fetchBreakingNews(),
    fetchHomepageArticles(),
    getActiveAds(),
    getActiveArticles(),
    getActiveSponsored(undefined, true),
  ]);

  const [leaderboard1, leaderboard2, leaderboard3] = pickAds(ads, "leaderboard", 3);
  const rectangleAds = pickAds(ads, "rectangle", 3);
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
      <AdSlot size="leaderboard" className="max-w-7xl mx-auto my-4" ad={leaderboard1} />

      <main className="max-w-7xl mx-auto pb-4">
        {/* Urgente articles — full-width red alerts */}
        {urgentArticles.length > 0 && (
          <div className="mb-8 space-y-4">
            {urgentArticles.map((a) => (
              <ArticleCard key={a.id} article={a} variant="urgente" />
            ))}
          </div>
        )}

        {/* Hero Slider */}
        <AnimateIn direction="up">
          <HeroSlider articles={sliderArticles} interval={6000} />
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
        {Object.entries(sectionConfig).map(([key, cfg], index) => {
          const sArticles = sectionArticles[key as Section];
          if (!sArticles || sArticles.length === 0) return null;
          const sponsoredItem = sponsoredPerSection[key as Section];

          return (
            <AnimateIn key={key} direction="up" delay={0.1}>
              <section className="mb-10">
                <div
                  className="border-t-4 pt-2 mb-4 flex items-center justify-between"
                  style={{ borderTopColor: cfg.color }}
                >
                  <h2
                    className="text-lg font-bold tracking-wide uppercase font-[family-name:var(--font-heading)]"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </h2>
                  <Link
                    href={cfg.path}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: cfg.color }}
                  >
                    +{cfg.label}
                  </Link>
                </div>
                <AnimateStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sArticles.slice(0, 2).map((a) => (
                    <StaggerItem key={a.id}>
                      <ArticleCard article={a} variant="standard" />
                    </StaggerItem>
                  ))}
                  {sponsoredItem ? (
                    <StaggerItem key={sponsoredItem.id}>
                      <ArticleCard article={sponsoredItem} variant="standard" sponsored />
                    </StaggerItem>
                  ) : (
                    sArticles.slice(2, 3).map((a) => (
                      <StaggerItem key={a.id}>
                        <ArticleCard article={a} variant="standard" />
                      </StaggerItem>
                    ))
                  )}
                </AnimateStagger>
              </section>

              {/* Rectangle ads row after Deportes (index 1) */}
              {index === 1 && (
                <div className="border-t border-[#d4cfc7] pt-6 mt-2 mb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[0, 1, 2].map((i) => (
                      <AdSlot key={i} size="rectangle" ad={rectangleAds[i] || undefined} />
                    ))}
                  </div>
                </div>
              )}
            </AnimateIn>
          );
        })}

        {/* Bottom leaderboard ad */}
        <AnimateIn direction="up" delay={0.1}>
          <AdSlot size="leaderboard" className="mb-10" ad={leaderboard3} />
        </AnimateIn>
      </main>

      <Footer />
      <AdModal ad={modalAd} />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}