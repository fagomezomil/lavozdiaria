import SectionPageLayout from "@/components/SectionPageLayout";
import { fetchSectionArticles } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getArticlesBySection, articles } from "@/lib/data";
import { getActiveArticles } from "@/lib/articles";
import { getActiveSponsored } from "@/lib/sponsored";
import type { Article, SponsoredContent, Section } from "@/lib/types";
import JsonLd from "@/components/JsonLd";
import { sectionBreadcrumbLd } from "@/lib/seo";

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

/** Renderiza una página de sección estándar (politica, deportes, economia,
 *  internacionales, tucuman). Usado tanto por /seccion como por /seccion/pagina/[page].
 *  rightSlot: si se pasa, el grid de notas pasa a 2 cols y el slot va sticky a la derecha (1/3). */
export async function renderStandardSectionPage(
  section: Section,
  page: number,
  subtitle: string,
  rightSlot?: React.ReactNode,
): Promise<React.ReactElement> {
  const [apiArticles, ads, customArticles, sponsoredContent] = await Promise.all([
    fetchSectionArticles(section),
    getActiveAds(undefined, section),
    getActiveArticles(section),
    getActiveSponsored(section),
  ]);

  const sponsoredIds = new Set(sponsoredContent.map((s) => s.id));
  const sponsoredItems = sponsoredContent.map(sponsoredToArticle);
  const sectionArticles = [
    ...customArticles,
    ...(apiArticles ?? getArticlesBySection(section)),
  ];
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const rectangleAds = ads.filter((a) => a.type === "rectangle");

  return (
    <>
      <JsonLd data={sectionBreadcrumbLd(section)} />
      <SectionPageLayout
        section={section}
        articles={sectionArticles}
        subtitle={subtitle}
        allArticles={
          apiArticles
            ? [...customArticles, ...articles, ...apiArticles]
            : [...customArticles, ...articles]
        }
        leaderboardAds={leaderboardAds}
        rectangleAds={rectangleAds}
        sponsoredIds={sponsoredIds}
        sponsoredItems={sponsoredItems}
        page={page}
        rightSlot={rightSlot}
      />
    </>
  );
}

/** Subtítulos por sección — usados por las páginas de sección y paginación.
 *  Deben coincidir con los textos hardcoded que tenían las páginas antes del refactor. */
export const SECTION_SUBTITLES: Record<Section, string> = {
  politica: "Las noticias más relevantes del ámbito político nacional e internacional.",
  deportes: "Resultados, crónicas y análisis del mundo deportivo.",
  economia: "Mercados, finanzas y tendencias económicas.",
  internacionales: "Noticias del mundo, relaciones internacionales y eventos globales.",
  tucuman: "Noticias de la provincia de Tucumán y la región del NOA.",
  opinion: "Columnistas y análisis de opinión.",
  actualidad: "Ciencia, tecnología, IA, descubrimientos y datos que te sorprenden.",
  espectaculos: "Farándula, famosos y todo el mundo del entretenimiento argentino.",
  horoscopo: "Horóscopo de hoy para los 12 signos del zodíaco.",
};

/** Secciones estándar (las que usan SectionPageLayout). opinion tiene layout propio. */
export const STANDARD_SECTIONS: Section[] = [
  "politica",
  "deportes",
  "economia",
  "internacionales",
  "tucuman",
  "actualidad",
  "espectaculos",
  "horoscopo",
];