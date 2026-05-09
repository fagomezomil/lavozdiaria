import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import AnimateIn from "@/components/animate/AnimateIn";
import AnimateStagger from "@/components/animate/AnimateStagger";
import StaggerItem from "@/components/animate/StaggerItem";
import { Article, Ad, Section, sectionConfig } from "@/lib/types";

interface SectionPageLayoutProps {
  section: Section;
  articles: Article[];
  subtitle: string;
  allArticles: Article[];
  leaderboardAd?: Ad | null;
}

export default function SectionPageLayout({
  section,
  articles,
  subtitle,
  allArticles,
  leaderboardAd,
}: SectionPageLayoutProps) {
  const cfg = sectionConfig[section];

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={allArticles} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimateIn direction="left">
          <div
            className="border-t-4 pt-3 mb-6"
            style={{ borderTopColor: cfg.color }}
          >
            <h1
              className="text-3xl font-bold tracking-wide font-[family-name:var(--font-heading)]"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
        </AnimateIn>

        <div className="rule mb-6" />

        <AnimateIn delay={0.1}>
          <AdSlot size="leaderboard" className="mb-6" ad={leaderboardAd} />
        </AnimateIn>

        <AnimateStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.length > 0 && (
            <StaggerItem>
              <div className="md:col-span-2 lg:col-span-2">
                <ArticleCard article={articles[0]} variant="hero" />
              </div>
            </StaggerItem>
          )}
          {articles.slice(1).map((a) => (
            <StaggerItem key={a.id}>
              <ArticleCard article={a} variant="standard" />
            </StaggerItem>
          ))}
        </AnimateStagger>
      </main>

      <Footer />
    </>
  );
}