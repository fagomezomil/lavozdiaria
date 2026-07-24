import { Metadata } from "next";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import AdStickyFooter from "@/components/AdStickyFooter";
import AgendaLayout from "@/components/AgendaLayout";
import { fetchBreakingNews } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { getActiveEvents } from "@/lib/agenda";
import { articles } from "@/lib/data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Agenda · Cartelera de Tucumán — ¡QUE NOTICIA!",
  description:
    "Agenda cultural, turística y deportiva de Tucumán. Teatros, tours, recitales y eventos deportivos en la provincia.",
};

export default async function AgendaPage() {
  const [ads, breakingData, events] = await Promise.all([
    getActiveAds(),
    fetchBreakingNews(),
    getActiveEvents(),
  ]);

  const breaking = breakingData ?? articles.filter((a) => a.breaking);
  const stickyFooterAd = ads.find((a) => a.type === "sticky_footer") || null;
  const leaderboardAds = ads.filter((a) => a.type === "leaderboard");
  const sidebarAds = ads.filter((a) => a.type === "sidebar");
  const leaderboardTop = leaderboardAds[0] || null;
  const leaderboardBottom = leaderboardAds.length > 1 ? leaderboardAds[1] : null;

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breaking} />
      <AgendaLayout
        events={events}
        leaderboardTop={leaderboardTop}
        leaderboardBottom={leaderboardBottom}
        sidebarAds={sidebarAds}
      />
      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}