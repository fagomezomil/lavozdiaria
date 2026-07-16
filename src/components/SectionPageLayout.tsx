import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import AdRotator from "@/components/AdRotator";
import { Article, Ad, Section, sectionConfig } from "@/lib/types";

interface SectionPageLayoutProps {
  section: Section;
  articles: Article[];
  subtitle: string;
  allArticles: Article[];
  leaderboardAds?: Ad[];
  rectangleAds?: Ad[];
  sponsoredIds?: Set<string>;
  page?: number;
  perPage?: number;
}

const PER_PAGE = 17;

export default function SectionPageLayout({
  section,
  articles,
  subtitle,
  allArticles,
  leaderboardAds = [],
  rectangleAds = [],
  sponsoredIds = new Set(),
  page = 1,
  perPage = PER_PAGE,
}: SectionPageLayoutProps) {
  const cfg = sectionConfig[section];

  // Sort: urgente first, then destacada, then normal
  const sorted = [...articles].sort((a, b) => {
    const order: Record<string, number> = { urgente: 0, destacada: 1, normal: 2 };
    return (order[a.layout || "normal"] ?? 2) - (order[b.layout || "normal"] ?? 2);
  });

  // Urgente articles — full-width above grid, only on page 1
  const urgentArticles = sorted.filter((a) => a.layout === "urgente");
  const gridArticles = sorted.filter((a) => a.layout !== "urgente");

  const totalPages = Math.max(1, Math.ceil(gridArticles.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  // Page 1 keeps the editorial layout (featured + sidebar + grid) totaling perPage items.
  // Page 2+ shows a flat grid of `perPage` standard cards.
  const isFirstPage = currentPage === 1;

  let featured: Article | undefined;
  let sidebarItems: Article[] = [];
  let gridItems: Article[] = [];

  if (isFirstPage) {
    featured = gridArticles[0];
    // Sidebar gets the next 4, grid gets the rest up to perPage total.
    sidebarItems = gridArticles.slice(1, 5);
    gridItems = gridArticles.slice(5, perPage);
  } else {
    const start = (currentPage - 1) * perPage;
    gridItems = gridArticles.slice(start, start + perPage);
  }

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
              className="text-3xl md:text-4xl font-black tracking-tight font-[family-name:var(--font-heading)] uppercase"
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
          <AdRotator ads={leaderboardAds} size="leaderboard" />
        </div>

        {/* Urgente articles — full width alerts, only on page 1 */}
        {isFirstPage &&
          urgentArticles.map((a) => (
            <div key={a.id} className="mb-6">
              <ArticleCard article={a} variant="urgente" />
            </div>
          ))}

        {/* Page 1 — editorial featured + sidebar layout */}
        {isFirstPage && featured && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Featured story — 2/3 width, comic panel hero */}
            <div className="lg:col-span-2">
              <Link
                href={sponsoredIds.has(featured.id) ? `/patrocinado/${featured.id}` : `/${featured.section}/${featured.id}`}
                className="group relative overflow-hidden bg-ink min-h-[260px] md:min-h-[440px] block border-ink-3 shadow-hard"
              >
                {featured.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.imageUrl}
                    alt={featured.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center halftone"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.color}30, #0a0a0a 80%)`,
                    }}
                  >
                    <span className="text-8xl font-[family-name:var(--font-heading)] opacity-30 text-white uppercase">LV</span>
                  </div>
                )}
                {/* Halftone + charcoal overlay — comic noir ink */}
                <div className="absolute inset-0 halftone-light opacity-60" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 45%, rgba(10,10,10,0.1) 100%)" }} />
                {/* Naranja edge tint */}
                <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ background: "radial-gradient(ellipse at bottom right, var(--color-brand), transparent 55%)" }} />
                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                  <span
                    className="stamp text-[11px] md:text-xs"
                    style={{ color: cfg.color, borderColor: cfg.color }}
                  >
                    {cfg.label}
                    {sponsoredIds.has(featured.id) && (
                      <span className="ml-1.5 text-[#16a34a]">Patrocinado</span>
                    )}
                  </span>
                  <h2 className="display text-2xl md:text-4xl lg:text-5xl text-white leading-[1.05] line-clamp-2 md:line-clamp-3 mt-3">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="mt-3 text-sm md:text-base text-white/75 line-clamp-2 hidden md:block font-[family-name:var(--font-body)] font-medium">
                      {featured.excerpt}
                    </p>
                  )}
                  {((featured.author ?? featured.publisher) || featured.date) && (
                    <p className="mt-3 text-xs text-white/60 tracking-wide uppercase font-[family-name:var(--font-heading)]">
                      {(featured.author ?? featured.publisher) && <span>{featured.author ?? featured.publisher}</span>}
                      {(featured.author ?? featured.publisher) && featured.date && <span> · </span>}
                      {featured.date && <span>{featured.date}</span>}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* Sidebar stack — 1/3 width */}
            <div className="flex flex-col gap-5">
              {sidebarItems.map((a) => {
                const aCfg = sectionConfig[a.section];
                const isSponsored = sponsoredIds.has(a.id);
                const href = isSponsored ? `/patrocinado/${a.id}` : `/${a.section}/${a.id}`;
                return (
                  <Link
                    key={a.id}
                    href={href}
                    className="group flex gap-3 py-3 border-b-2 border-ink last:border-0 hover:bg-brand/10 transition-colors -mx-1 px-1"
                  >
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.imageUrl}
                        alt={a.imageAlt}
                        className="w-24 h-20 object-cover shrink-0 border-2 border-ink"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-24 h-20 shrink-0 flex items-center justify-center border-2 border-ink"
                        style={{ background: `linear-gradient(135deg, ${aCfg.color}15, ${aCfg.color}05)` }}
                      >
                        <span className="text-xl font-[family-name:var(--font-heading)] opacity-30" style={{ color: aCfg.color }}>
                          LV
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[11px] font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
                        style={{ color: aCfg.color }}
                      >
                        {aCfg.label}
                        {isSponsored && (
                          <span className="ml-1.5 text-[#16a34a]">Patrocinado</span>
                        )}
                      </span>
                      <h3 className="display text-[15px] leading-snug line-clamp-2 mt-0.5 group-hover:text-brand transition-colors">
                        {a.title}
                      </h3>
                      {((a.author ?? a.publisher) || a.date) && (
                        <p className="text-xs text-muted mt-1 uppercase tracking-wide font-[family-name:var(--font-heading)]">
                          {(a.author ?? a.publisher) && <span>{a.author ?? a.publisher}</span>}
                          {(a.author ?? a.publisher) && a.date && <span> · </span>}
                          {a.date && <span>{a.date}</span>}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Page 1 — remaining grid items after featured+sidebar */}
        {isFirstPage && gridItems.length > 0 && (
          <>
            <div
              className="border-t-2 pt-2 mb-6 flex items-center justify-between"
              style={{ borderTopColor: cfg.color }}
            >
              <h2
                className="display text-sm tracking-widest uppercase"
                style={{ color: cfg.color }}
              >
                Más en {cfg.label}
              </h2>
              <span className="text-xs text-muted uppercase tracking-wide font-[family-name:var(--font-heading)]">
                {gridItems.length} artículos
              </span>
            </div>

            {renderGridWithAds(gridItems, rectangleAds, sponsoredIds)}
          </>
        )}

        {/* Pages 2+ — flat grid of standard cards */}
        {!isFirstPage && gridItems.length > 0 && (
          renderGridWithAds(gridItems, rectangleAds, sponsoredIds)
        )}

        {/* Pagination — comic noir */}
        {totalPages > 1 && (
          <Pagination
            section={section}
            currentPage={currentPage}
            totalPages={totalPages}
            sectionPath={cfg.path}
          />
        )}
      </main>

      {/* Leaderboard ad before footer — mismo formato que el del inicio */}
      {leaderboardAds.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <AdRotator ads={leaderboardAds} size="leaderboard" />
        </div>
      )}

      <Footer />
    </>
  );
}

/** Render the "Más en {sección}" grid splitting items into chunks of 6,
 *  inserting a rectangle ad row after every 6 articles (both on page 1 and 2+). */
function renderGridWithAds(
  items: Article[],
  rectangleAds: Ad[],
  sponsoredIds: Set<string>
): React.ReactNode {
  if (items.length === 0) return null;

  const chunks: Article[][] = [];
  for (let i = 0; i < items.length; i += 6) {
    chunks.push(items.slice(i, i + 6));
  }

  return (
    <div className="space-y-8">
      {chunks.map((chunk, idx) => (
        <div key={idx}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chunk.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                variant="standard"
                sponsored={sponsoredIds.has(a.id)}
              />
            ))}
          </div>
          {/* Rectangle ad row after this 6-item chunk (except after the last one) */}
          {idx < chunks.length - 1 && rectangleAds.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {rectangleAds.slice(0, 3).map((_, i) => (
                <div key={`rect-${idx}-${i}`}>
                  <AdRotator ads={rectangleAds} size="rectangle" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Pagination({
  section,
  currentPage,
  totalPages,
  sectionPath,
}: {
  section: Section;
  currentPage: number;
  totalPages: number;
  sectionPath: string;
}) {
  const pages: number[] = [];
  const range = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= range) {
      pages.push(i);
    }
  }
  // Insert gaps
  const withGaps: (number | "...")[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) withGaps.push("...");
    withGaps.push(pages[i]);
  }

  const pageHref = (p: number) =>
    p === 1 ? sectionPath : `${sectionPath}?page=${p}`;

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2 flex-wrap"
      aria-label="Paginación"
    >
      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 shadow-hard-sm hover:bg-brand hover:text-white font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold transition-colors"
        >
          <span>←</span> Anterior
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 opacity-40 font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold">
          <span>←</span> Anterior
        </span>
      )}

      {withGaps.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-muted font-[family-name:var(--font-heading)]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className={`w-9 h-9 flex items-center justify-center border-ink-2 shadow-hard-sm font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold transition-colors ${
              p === currentPage
                ? "bg-brand text-white"
                : "bg-paper hover:bg-brand/20"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 shadow-hard-sm hover:bg-brand hover:text-white font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold transition-colors"
        >
          Siguiente <span>→</span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 bg-paper border-ink-2 opacity-40 font-[family-name:var(--font-heading)] uppercase tracking-wider text-xs font-bold">
          Siguiente <span>→</span>
        </span>
      )}
    </nav>
  );
}