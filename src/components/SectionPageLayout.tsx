import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import AdInFeed from "@/components/AdInFeed";
import { Article, Ad, Section, sectionConfig } from "@/lib/types";

interface SectionPageLayoutProps {
  section: Section;
  articles: Article[];
  subtitle: string;
  allArticles: Article[];
  leaderboardAd?: Ad | null;
  inFeedAd?: Ad | null;
  sponsoredIds?: Set<string>;
}

export default function SectionPageLayout({
  section,
  articles,
  subtitle,
  allArticles,
  leaderboardAd,
  inFeedAd,
  sponsoredIds = new Set(),
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

  // Featured = first non-urgent article, rest = standard stack
  const featured = gridArticles[0];
  const rest = gridArticles.slice(1);

  // Insert ad after 2nd grid article
  const adIndex = 2;

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={allArticles} />

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-10">
        {/* Section header — bold typographic anchor */}
        <div className="mb-6">
          <div
            className="border-l-4 pl-4 py-1"
            style={{ borderLeftColor: cfg.color }}
          >
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight font-[family-name:var(--font-heading)]"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
        </div>

        <div className="rule-thin mb-6" />

        {/* Leaderboard ad */}
        <div className="mb-8">
          <AdSlot size="leaderboard" ad={leaderboardAd} />
        </div>

        {/* Urgente articles — full width red alerts */}
        {urgentArticles.map((a) => (
          <div key={a.id} className="mb-6">
            <ArticleCard article={a} variant="urgente" />
          </div>
        ))}

        {/* Featured + sidebar layout */}
        {featured && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Featured story — 2/3 width */}
            <div className="lg:col-span-2">
              <ArticleCard
                article={featured}
                variant="featured"
                sponsored={sponsoredIds.has(featured.id)}
              />
            </div>

            {/* Sidebar stack — 1/3 width */}
            <div className="flex flex-col gap-5">
              {rest.slice(0, 4).map((a, i) => {
                const aCfg = sectionConfig[a.section];
                const isSponsored = sponsoredIds.has(a.id);
                const href = isSponsored ? `/patrocinado/${a.id}` : `/${a.section}/${a.id}`;

                // Insert ad after 2nd sidebar item
                const elements: React.ReactNode[] = [];

                elements.push(
                  <Link
                    key={a.id}
                    href={href}
                    className="group flex gap-3 py-3 border-b border-rule last:border-0 hover:bg-cream/50 transition-colors -mx-1 px-1 rounded-sm"
                  >
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.imageUrl}
                        alt={a.imageAlt}
                        className="w-24 h-20 object-cover rounded-sm shrink-0 border-t-2"
                        style={{ borderTopColor: aCfg.color }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-24 h-20 rounded-sm shrink-0 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${aCfg.color}15, ${aCfg.color}05)`,
                          borderTop: `2px solid ${aCfg.color}`,
                        }}
                      >
                        <span className="text-xl font-[family-name:var(--font-heading)] opacity-15" style={{ color: aCfg.color }}>
                          LV
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[11px] font-bold tracking-widest uppercase"
                        style={{ color: aCfg.color }}
                      >
                        {aCfg.label}
                        {isSponsored && (
                          <span className="ml-1.5 text-[#10b981]">Patrocinado</span>
                        )}
                      </span>
                      <h3 className="text-[15px] font-semibold leading-snug font-[family-name:var(--font-heading)] line-clamp-2 mt-0.5 group-hover:underline">
                        {a.title}
                      </h3>
                      {(a.author || a.date) && (
                        <p className="text-xs text-muted mt-1">
                          {a.author && <span>{a.author}</span>}
                          {a.author && a.date && <span> · </span>}
                          {a.date && <span>{a.date}</span>}
                        </p>
                      )}
                    </div>
                  </Link>
                );

                if (i === 1 && inFeedAd) {
                  elements.push(
                    <div key="ad" className="my-1">
                      <AdInFeed ad={inFeedAd} />
                    </div>
                  );
                }

                return elements;
              })}
            </div>
          </div>
        )}

        {/* Remaining articles — clean grid */}
        {rest.length > 4 && (
          <>
            <div
              className="border-t-2 pt-2 mb-6 flex items-center justify-between"
              style={{ borderTopColor: cfg.color }}
            >
              <h2
                className="text-sm font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
                style={{ color: cfg.color }}
              >
                Más en {cfg.label}
              </h2>
              <span className="text-xs text-muted">
                {rest.length - 4} artículos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.slice(4).map((a, i) => {
                const elements: React.ReactNode[] = [];

                elements.push(
                  <ArticleCard
                    key={a.id}
                    article={a}
                    variant="standard"
                    sponsored={sponsoredIds.has(a.id)}
                  />
                );

                // Insert rectangle ad row after 3rd remaining article
                if (i === 2) {
                  elements.push(
                    <div key="rectangle-ad" className="col-span-1 sm:col-span-2 lg:col-span-3">
                      <AdSlot size="leaderboard" ad={null} />
                    </div>
                  );
                }

                return elements;
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}