import type { Metadata } from "next";
import { getSportsMatchesBySport, getStandings } from "@/lib/sports";
import FixturePage from "@/components/FixturePage";
import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Fixture Fútbol 2026: Liga Profesional y Primera Nacional | ¡QUE NOTICIA!",
  description:
    "Fixture completo del fútbol argentino 2026: Liga Profesional y Primera Nacional. Resultados, próximos partidos y horarios, fecha por fecha.",
  alternates: { canonical: "/deportes/futbol" },
  robots: { index: true, follow: true },
};

export default async function DeportesFutbolPage() {
  const [matches, standingsA, standingsB, pnStandingsA, pnStandingsB] = await Promise.all([
    getSportsMatchesBySport("futbol"),
    getStandings("futbol", "A", { tournament: "Liga Profesional" }),
    getStandings("futbol", "B", { tournament: "Liga Profesional" }),
    getStandings("futbol", "A", { tournament: "Primera Nacional" }),
    getStandings("futbol", "B", { tournament: "Primera Nacional" }),
  ]);
  return (
    <>
      <Header />
      <NavbarWrapper />
      <main>
        <FixturePage
          matches={matches}
          sport="futbol"
          standingsA={standingsA}
          standingsB={standingsB}
          pnStandingsA={pnStandingsA}
          pnStandingsB={pnStandingsB}
        />
      </main>
      <Footer />
    </>
  );
}