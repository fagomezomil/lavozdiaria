import Link from "next/link";
import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import BreakingNews from "@/components/BreakingNews";
import ArticleCard from "@/components/ArticleCard";
import AdSlot from "@/components/AdSlot";
import AdRotator from "@/components/AdRotator";
import AdInFeed from "@/components/AdInFeed";
import AdModal from "@/components/AdModal";
import AdStickyFooter from "@/components/AdStickyFooter";
import Footer from "@/components/Footer";
import AnimateIn from "@/components/animate/AnimateIn";
import HeroEditorial from "@/components/HeroEditorial";
import { sectionConfig } from "@/lib/types";
import type { Section, Article, Ad, SponsoredContent, AgendaEvent, CustomArticle } from "@/lib/types";
import { articles as seedArticles, getArticlesBySection } from "@/lib/data";
import {
  fetchBreakingNews,
  fetchHomepageArticles,
} from "@/lib/api";
import { getActiveAds, pickAd } from "@/lib/ads";
import { getActiveArticles, getPortadaFeatured } from "@/lib/articles";
import { getActiveSponsored } from "@/lib/sponsored";
import { fetchCurrentWeather } from "@/lib/weather";
import { getActiveColumnists } from "@/lib/columnists";
import WeatherStrip from "@/components/WeatherStrip";
import OpinionBlock from "@/components/OpinionBlock";
import AgendaCarousel from "@/components/AgendaCarousel";
import HoroscopoWidget from "@/components/HoroscopoWidget";
import MatchCard from "@/components/MatchCard";
import { getActiveEvents } from "@/lib/agenda";
import { getSportsMatches } from "@/lib/sports";
import type { SportsMatch } from "@/lib/types";

function RectangleAdsRow({ ads }: { ads: Ad[] }) {
  return (
    <div className="border-t border-border pt-6 mt-2 mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdRotator ads={ads} size="rectangle" />
        <div className="hidden sm:block">
          <AdRotator ads={ads} size="rectangle" />
        </div>
        <div className="hidden lg:block">
          <AdRotator ads={ads} size="rectangle" />
        </div>
      </div>
    </div>
  );
}

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
  const [breakingData, sectionData, ads, customArticles, sponsoredContent, weather, columnists, portadaFeatured, events, matches] = await Promise.all([
    fetchBreakingNews(),
    fetchHomepageArticles(),
    getActiveAds(),
    getActiveArticles(),
    getActiveSponsored(undefined, true),
    fetchCurrentWeather(),
    getActiveColumnists(),
    getPortadaFeatured(),
    getActiveEvents(),
    getSportsMatches("futbol"),
  ]);

  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const rectangleAds = ads.filter((a) => a.type === "rectangle");
  const modalAd = pickAd(ads, "modal");
  const stickyFooterAd = pickAd(ads, "sticky_footer");

  // Merge custom breaking news with API breaking news
  const customBreaking = customArticles.filter((a) => a.breaking);
  const apiBreaking = breakingData ?? seedArticles.filter((a) => a.breaking);
  let breaking = [...customBreaking, ...apiBreaking];

  // Sin toggleadas del admin, la faja se llena con los titulares del
  // HeroEditorial (politica, economia, tucuman) para no quedar vacía.
  if (customBreaking.length === 0) {
    const heroFallback = (["politica", "economia", "tucuman"] as Section[])
      .map((s) => sliderArticles.find((a) => a.section === s))
      .filter((a): a is CustomArticle => Boolean(a))
      .map((a) => ({ ...a, breaking: true }));
    breaking = [...breaking, ...heroFallback];
  }

  // Build section articles: custom first, then API/seed
  // opinion is manual-only — FreeNewsApi doesn't supply it, so it defaults to [].
  const apiSectionArticles: Partial<Record<Section, Article[]>> = sectionData ?? {
    politica: getArticlesBySection("politica"),
    deportes: getArticlesBySection("deportes"),
    economia: getArticlesBySection("economia"),
    internacionales: getArticlesBySection("internacionales"),
    tucuman: getArticlesBySection("tucuman"),
    opinion: [],
    actualidad: [],
    espectaculos: [],
    horoscopo: [],
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
    sectionArticles[key] = [...custom, ...(apiSectionArticles[key] ?? [])];
  }

  // Flatten all articles for hero/sidebar logic
  const allArticles = Object.values(sectionArticles).flat();

  // Hero editorial + header slide + secondary grid vienen del helper cacheado.
  // HeroEditorial + secondary se excluyen de los section grids para evitar duplicación.
  const { heroEditorial: sliderArticles } = portadaFeatured;
  const excludedIds = new Set<string>(sliderArticles.map((a) => a.id));

  // Re-excluir heroEditorial de los section grids (edit in-place)
  for (const key of Object.keys(sectionConfig) as Section[]) {
    if (excludedIds.size === 0) break;
    sectionArticles[key] = sectionArticles[key].filter((a) => !excludedIds.has(a.id));
  }

  // Urgente articles from all sections (cross-section)
  const urgentArticles = allArticles.filter((a) => a.layout === "urgente");

  // Agenda hero en portada: 2 cultural + 2 turístico + 1 deportivo (top por fecha)
  const agendaHeroEvents: AgendaEvent[] = [
    ...events.filter((e) => e.category === "cultural").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2),
    ...events.filter((e) => e.category === "turistico").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2),
    ...events.filter((e) => e.category === "deportivo").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 1),
  ];

  // Próximos partidos de Boca, River y Atlético Tucumán (1 por equipo, el más próximo)
  const featuredTeams = ["Boca Juniors", "River Plate", "Atlético Tucumán"];
  const todayIso = new Date().toISOString().slice(0, 10);
  const featuredByTeam = featuredTeams
    .map((team) =>
      matches
        .filter(
          (m) =>
            (m.home_team === team || m.away_team === team) &&
            (m.status === "scheduled" || m.status === "live") &&
            m.match_date >= todayIso,
        )
        .sort((a, b) => a.match_date.localeCompare(b.match_date))[0],
    )
    .filter((m): m is SportsMatch => Boolean(m))
    // Si dos equipos featured se enfrentan, ambos .map devuelven el mismo
    // partido → dedupe por id para evitar duplicate key en React.
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);

  // Si dos featured comparten partido queda un slot libre: completar con otro
  // partido próximo que no involucre a ninguno de los 3 equipos featured.
  const featuredMatches: SportsMatch[] =
    featuredByTeam.length >= featuredTeams.length
      ? featuredByTeam
      : [
          ...featuredByTeam,
          ...matches
            .filter(
              (m) =>
                (m.status === "scheduled" || m.status === "live") &&
                m.match_date >= todayIso &&
                !featuredTeams.some((t) => m.home_team === t || m.away_team === t) &&
                !featuredByTeam.some((f) => f.id === m.id),
            )
            .sort((a, b) => a.match_date.localeCompare(b.match_date))
            .slice(0, featuredTeams.length - featuredByTeam.length),
        ];

  return (
    <>
      <Header />
      <NavbarWrapper />
      <BreakingNews articles={breaking} />

      {/* Leaderboard ad */}
      <div className="max-w-7xl mx-auto px-4 my-4">
        <AdRotator ads={leaderboardAds} size="leaderboard" />
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 pb-4 min-w-0">
        <h1 className="sr-only">¡QUE NOTICIA! — Medio regional de Tucumán</h1>
        {/* Urgente articles — full-width red alerts */}
        {urgentArticles.length > 0 && (
          <div className="mb-8 space-y-4">
            {urgentArticles.map((a) => (
              <ArticleCard key={a.id} article={a} variant="urgente" />
            ))}
          </div>
        )}

        {/* Hero Editorial */}
        <HeroEditorial articles={sliderArticles} />

        <div className="rule my-6" />

        {/* Leaderboard ad */}
        <AnimateIn delay={0.1}>
          <AdRotator ads={leaderboardAds} size="leaderboard" />
        </AnimateIn>

        {/* Section grids — opinion is rendered separately as a 4-card block */}
        {(["politica", "tucuman", "deportes", "economia", "internacionales", "espectaculos", "actualidad"] as Section[])
          .map((key, index) => {
          const cfg = sectionConfig[key];
          const sArticles = sectionArticles[key];
          if (!sArticles || sArticles.length === 0) return null;
          const sponsoredItem = sponsoredPerSection[key];

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

              {/* Opinion block after Tucumán (index 1) — arriba de Deportes, 4 cards con avatares */}
              {index === 1 && sectionArticles.opinion && sectionArticles.opinion.length > 0 && (
                <AnimateIn direction="up" delay={0.1}>
                  <OpinionBlock articles={sectionArticles.opinion} columnists={columnists} />
                </AnimateIn>
              )}

              {/* Rectangle ads row after Tucumán (index 1) */}
              {index === 1 && <RectangleAdsRow ads={rectangleAds} />}

              {/* Próximos partidos Boca/River/Atlético Tucumán + CTA al fixture */}
              {index === 2 && featuredMatches.length > 0 && (
                <div className="mt-4 mb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {featuredMatches.map((m) => (
                      <MatchCard key={m.id} match={m} variant="card" />
                    ))}
                    <Link
                      href="/deportes/futbol"
                      className="relative border-2 border-ink bg-deportes text-white shadow-hard-sm p-4 flex flex-col justify-between hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase tracking-[0.14em] font-bold bg-ink px-2 py-1 font-[family-name:var(--font-heading)]">
                          Liga Profesional
                        </span>
                      </div>
                      <div>
                        <p
                          className="text-2xl font-bold font-[family-name:var(--font-heading)] leading-[1.05] tracking-tight mb-2"
                          style={{ textTransform: "none" }}
                        >
                          La info del campeonato está acá
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.14em] font-semibold opacity-90 font-[family-name:var(--font-heading)] flex items-center gap-1.5">
                          Ver fixture y tabla
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Rectangle ads row between partidos widget and weather (index 2) */}
              {index === 2 && <RectangleAdsRow ads={rectangleAds} />}

              {/* Weather strip after Deportes (index 2) */}
              {index === 2 && (
                <div className="mb-10">
                  <WeatherStrip weather={weather} />
                </div>
              )}

              {/* Leaderboard ad between Economia and Agenda (index 3) */}
              {index === 3 && (
                <AnimateIn direction="up" delay={0.1}>
                  <AdRotator ads={leaderboardAds} size="leaderboard" className="my-10" />
                </AnimateIn>
              )}

              {/* Agenda block after Economia (index 3) — carrusel horizontal con CTA */}
              {index === 3 && agendaHeroEvents.length > 0 && (
                <AnimateIn direction="up" delay={0.1}>
                  <section className="mb-10">
                    <div
                      className="border-t-2 pt-2 mb-4 flex items-center justify-between"
                      style={{ borderTopColor: "var(--color-agenda)" }}
                    >
                      <h2
                        className="text-sm font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]"
                        style={{ color: "var(--color-agenda)" }}
                      >
                        Agenda
                      </h2>
                      <Link
                        href="/agenda"
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "var(--color-agenda)" }}
                      >
                        +Agenda
                      </Link>
                    </div>
                    <AgendaCarousel events={agendaHeroEvents} />
                  </section>
                </AnimateIn>
              )}

              {/* Horóscopo chips after Espectaculos (index 5), antes de Actualidad — fila de 12 signos */}
              {index === 5 && (
                <AnimateIn direction="up" delay={0.1}>
                  <HoroscopoWidget articles={customArticles} />
                </AnimateIn>
              )}

              {/* Rectangle ads row after Internacionales (index 4) — entre internacionales y espectaculos */}
              {index === 4 && <RectangleAdsRow ads={rectangleAds} />}
            </AnimateIn>
          );
        })}

        {/* Bottom leaderboard ad */}
        <AnimateIn direction="up" delay={0.1}>
          <AdRotator ads={leaderboardAds} size="leaderboard" className="mb-10" />
        </AnimateIn>
      </main>

      <Footer />
      {modalAd?.image_url && (
        <link rel="preload" as="image" href={modalAd.image_url} />
      )}
      {modalAd?.mobile_image_url && (
        <link rel="preload" as="image" href={modalAd.mobile_image_url} />
      )}
      <AdModal ad={modalAd} />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}