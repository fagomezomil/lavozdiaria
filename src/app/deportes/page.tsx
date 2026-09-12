import type { Metadata } from "next";
import { SECTION_META, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/site";
import { renderStandardSectionPage, SECTION_SUBTITLES } from "@/lib/section-page";
import { getSportsMatches, getStandings } from "@/lib/sports";
import FixtureWidget from "@/components/FixtureWidget";

export const revalidate = 300;

export const metadata: Metadata = {
  title: SECTION_META.deportes.title,
  description: SECTION_META.deportes.description,
  alternates: { canonical: "/deportes" },
  openGraph: {
    title: `${SECTION_META.deportes.title} | ${SITE_NAME}`,
    description: SECTION_META.deportes.description,
    url: `${SITE_URL}/deportes`,
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    title: `${SECTION_META.deportes.title} | ${SITE_NAME}`,
    description: SECTION_META.deportes.description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function DeportesPage() {
  const [matches, standingsA, standingsB, pnStandingsA, pnStandingsB] = await Promise.all([
    getSportsMatches(),
    getStandings("futbol", "A", { tournament: "Liga Profesional" }),
    getStandings("futbol", "B", { tournament: "Liga Profesional" }),
    getStandings("futbol", "A", { tournament: "Primera Nacional" }),
    getStandings("futbol", "B", { tournament: "Primera Nacional" }),
  ]);
  const rightSlot =
    matches.length > 0 ? (
      <FixtureWidget
        matches={matches}
        standingsA={standingsA}
        standingsB={standingsB}
        pnStandingsA={pnStandingsA}
        pnStandingsB={pnStandingsB}
      />
    ) : null;
  return renderStandardSectionPage("deportes", 1, SECTION_SUBTITLES.deportes, rightSlot);
}