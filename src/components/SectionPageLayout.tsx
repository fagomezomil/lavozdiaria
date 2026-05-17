import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import AdInFeed from "@/components/AdInFeed";
import Footer from "@/components/Footer";
import AnimateIn from "@/components/animate/AnimateIn";
import AnimateStagger from "@/components/animate/AnimateStagger";
import StaggerItem from "@/components/animate/StaggerItem";
import { Article, Ad, Section, ArticleLayout, sectionConfig } from "@/lib/types";

interface SectionPageLayoutProps {
  section: Section;
  articles: Article[];
  subtitle: string;
  allArticles: Article[];
  leaderboardAd?: Ad | null;
  inFeedAd?: Ad | null;
}

function getVariant(layout?: ArticleLayout): "urgente" | "featured" | "standard" {
  if (layout === "urgente") return "urgente";
  if (layout === "destacada") return "featured";
  return "standard";
}

function getColSpan(layout?: ArticleLayout): string {
  if (layout === "urgente") return "lg:col-span-3 sm:col-span-2";
  if (layout === "destacada") return "sm:col-span-2";
  return "";
}

export default function SectionPageLayout({
  section,
  articles,
  subtitle,
  allArticles,
  leaderboardAd,
  inFeedAd,
}: SectionPageLayoutProps) {
  const cfg = sectionConfig[section];

  // Sort: urgente first, then destacada, then normal
  const sorted = [...articles].sort((a, b) => {
    const order: Record<string, number> = { urgente: 0, destacada: 1, normal: 2 };
    return (order[a.layout || "normal"] ?? 2) - (order[b.layout || "normal"] ?? 2);
  });

  // Separate urgente (full-width above grid) from the rest
  const urgentArticles = sorted.filter((a) => a.layout === "urgente");
  const gridArticles = sorted.filter((a) => a.layout !== "urgente");

  // Insert ad after 2nd grid article
  const adIndex = 2;

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

        {/* Urgente articles — full width above the grid */}
        {urgentArticles.map((a) => (
          <AnimateIn key={a.id} direction="up" delay={0.1}>
            <div className="mb-6">
              <ArticleCard article={a} variant="urgente" />
            </div>
          </AnimateIn>
        ))}

        {/* Grid — destacada (2 cols) + standard (1 col) */}
        <AnimateStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridArticles.map((a, i) => {
            const variant = getVariant(a.layout);
            const colSpan = getColSpan(a.layout);
            const elements: React.ReactNode[] = [];

            elements.push(
              <StaggerItem key={a.id} className={colSpan}>
                <ArticleCard article={a} variant={variant} />
              </StaggerItem>
            );

            // Insert ad after 2nd grid article
            if (i === adIndex - 1 && inFeedAd) {
              elements.push(
                <StaggerItem key="ad">
                  <AdInFeed ad={inFeedAd} />
                </StaggerItem>
              );
            }

            return elements;
          })}
        </AnimateStagger>
      </main>

      <Footer />
    </>
  );
}