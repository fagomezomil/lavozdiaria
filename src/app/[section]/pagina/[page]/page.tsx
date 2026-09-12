import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  renderStandardSectionPage,
  SECTION_SUBTITLES,
  STANDARD_SECTIONS,
} from "@/lib/section-page";
import { SECTION_META, SITE_URL, SITE_NAME } from "@/lib/site";
import { getSportsMatches, getStandings } from "@/lib/sports";
import FixtureWidget from "@/components/FixtureWidget";
import type { Section } from "@/lib/types";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ section: string; page: string }>;
}

function parseSection(raw: string): Section | null {
  if (!STANDARD_SECTIONS.includes(raw as Section)) return null;
  return raw as Section;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { section: rawSection, page: rawPage } = await params;
  const section = parseSection(rawSection);
  const pageNum = Math.max(1, parseInt(rawPage, 10) || 1);
  if (!section) return { title: "Sección no encontrada" };
  const cfg = SECTION_META[section];
  const canonical = `/${section}/pagina/${pageNum}`;
  return {
    title: `${cfg.title} — Página ${pageNum}`,
    description: cfg.description,
    // Paginación 2+ no indexada: cada artículo se indexa por su URL propia,
    // evitar duplicate/thin content en archivos paginados.
    robots: { index: false, follow: true },
    alternates: { canonical },
    openGraph: {
    title: `${cfg.title} — Página ${pageNum} | ${SITE_NAME}`,
    description: cfg.description,
    url: `${SITE_URL}${canonical}`,
    type: "website",
    },
    twitter: {
    title: `${cfg.title} — Página ${pageNum} | ${SITE_NAME}`,
    description: cfg.description,
    },
  };
}

/** Pre-genera página 2 para cada sección estándar (la más común).
 *  Páginas 3+ se generan on-demand con ISR (dynamicParams = true por defecto). */
export async function generateStaticParams() {
  return STANDARD_SECTIONS.map((section) => ({
    section,
    page: "2",
  }));
}

export default async function SectionPaginationPage({ params }: PageProps) {
  const { section: rawSection, page: rawPage } = await params;
  const section = parseSection(rawSection);
  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  if (!section || page < 2) notFound();
  // /deportes/pagina/N también muestra el fixture widget
  if (section === "deportes") {
    const [matches, standingsA, standingsB, pnStandingsA, pnStandingsB] = await Promise.all([
      getSportsMatches(),
      getStandings("futbol", "A", { tournament: "Liga Profesional" }),
      getStandings("futbol", "B", { tournament: "Liga Profesional" }),
      getStandings("futbol", "A", { tournament: "Primera Nacional" }),
      getStandings("futbol", "B", { tournament: "Primera Nacional" }),
    ]);
    const slot =
      matches.length > 0 ? (
        <FixtureWidget
          matches={matches}
          standingsA={standingsA}
          standingsB={standingsB}
          pnStandingsA={pnStandingsA}
          pnStandingsB={pnStandingsB}
        />
      ) : null;
    return renderStandardSectionPage(section, page, SECTION_SUBTITLES[section], slot);
  }
  return renderStandardSectionPage(section, page, SECTION_SUBTITLES[section]);
}