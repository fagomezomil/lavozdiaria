import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import AdStickyFooter from "@/components/AdStickyFooter";
import AdRotator from "@/components/AdRotator";
import SubmitEventForm from "@/components/agenda/SubmitEventForm";
import { fetchBreakingNews } from "@/lib/api";
import { getActiveAds } from "@/lib/ads";
import { articles } from "@/lib/data";

export const revalidate = 300;

export const metadata = {
  title: "Envianos tu evento | ¡QUE NOTICIA!",
  description: "Proponé un evento para la Agenda Cultural de Tucumán.",
};

export default async function SubmitEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/agenda/submit");

  const [ads, breakingData] = await Promise.all([
    getActiveAds(),
    fetchBreakingNews(),
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Leaderboard top */}
        {leaderboardTop && (
          <div className="mb-8">
            <AdRotator ads={[leaderboardTop]} size="leaderboard" />
          </div>
        )}

        {/* Header */}
        <header className="mb-6">
          <p className="text-agenda text-xs font-semibold uppercase tracking-widest mb-2">
            Agenda Cultural Tucumán
          </p>
          <h1
            className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-heading)] text-agenda leading-[0.95] tracking-tight"
            style={{ textTransform: "none" }}
          >
            Envianos tu evento
          </h1>
          <p className="mt-3 text-base text-muted italic max-w-2xl font-[family-name:var(--font-body)]">
            Completá el formulario con los datos del evento. El equipo editorial lo revisa y, si
            encaja en la agenda, lo publica en /agenda.
          </p>
        </header>

        {/* Grid 3 cols contenido + 1 sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <SubmitEventForm userEmail={user.email} />
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <section className="border-2 border-ink bg-paper p-4 shadow-hard-sm">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-agenda font-bold font-[family-name:var(--font-heading)] border-b border-agenda pb-2 mb-3">
                Tu propuesta
              </h2>
              <p className="text-sm text-ink/80 leading-relaxed">
                Al enviar, tu propuesta queda en cola para que el equipo editorial la revise. Te
                avisaremos por email si se publica o si necesitamos algún ajuste.
              </p>
              <p className="text-xs text-muted mt-3">
                Podés ver el estado de tus propuestas en{" "}
                <a href="/mis-propuestas" className="text-agenda hover:underline font-semibold">
                  /mis-propuestas
                </a>
                .
              </p>
            </section>

            {sidebarAds.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted font-[family-name:var(--font-heading)]">
                  Avisos
                </h2>
                {sidebarAds.slice(0, 4).map((ad) => (
                  <div key={ad.id}>
                    <AdRotator ads={[ad]} size="sidebar" />
                  </div>
                ))}
              </section>
            )}
          </aside>
        </div>

        {/* Leaderboard bottom */}
        {leaderboardBottom && (
          <div className="mt-12">
            <AdRotator ads={[leaderboardBottom]} size="leaderboard" />
          </div>
        )}
      </div>

      <Footer />
      <AdStickyFooter ad={stickyFooterAd} />
    </>
  );
}