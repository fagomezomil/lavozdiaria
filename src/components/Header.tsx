import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import WeatherBadge from "@/components/WeatherBadge";
import SocialLinks from "@/components/SocialLinks";
import HeaderFeaturedSlide from "@/components/HeaderFeaturedSlide";
import { fetchCurrentWeather, TUCUMAN_NAME } from "@/lib/weather";
import { getFeaturedArticles, getActiveArticles } from "@/lib/articles";

export default async function Header() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [weather, featuredRaw] = await Promise.all([
    fetchCurrentWeather(),
    getFeaturedArticles(6),
  ]);

  // Fallback: si la redacción no marcó ninguna destacada, usar las últimas publicadas.
  const isFallback = featuredRaw.length === 0;
  const featured = isFallback
    ? await getActiveArticles().then((all) => all.slice(0, 6))
    : featuredRaw;

  return (
    <header className="bg-white text-white relative" style={{ overflow: "visible" }}>
      {/* Top bar — naranja + halftone */}
      <div
        className="bg-gray-200 halftone-light w-full mx-auto px-4 py-1.5 flex items-center justify-between text-xs tracking-wider uppercase text-orange-600 relative"
        style={{ overflow: "visible", position: "relative", zIndex: 60 }}
      >
        <div className="max-w-7xl mx-auto w-full flex justify-between">
          <div className="flex items-center gap-3">
            <span className="hidden md:inline font-[family-name:var(--font-heading)] uppercase tracking-wider">{today}</span>
            {weather && (
              <WeatherBadge
                temperature={weather.current.temperature}
                weatherIcon={weather.current.weatherIcon}
                cityName={TUCUMAN_NAME}
              />
            )}
          </div>
          <div className="flex gap-4">
            <SocialLinks />
            <HeaderAuth />
          </div>
        </div>
      </div>

      {/* Masthead — logo izquierda + slide de destacadas derecha */}
      <div className="max-w-7xl mx-auto  relative hidden md:block">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="group flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logodesktop.png"
              alt="¡Qué Noticia!"
              className="hidden md:block w-auto h-[210px] py-2 object-contain"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logomobile.png"
              alt="¡Qué Noticia!"
              className="md:hidden w-auto h-[56px] object-contain mx-auto"
            />
          </Link>

          {/* Slide de destacadas — llena el espacio sobrante del header */}
          <div className="flex-1 min-w-0">
            <HeaderFeaturedSlide
              articles={featured}
              title={isFallback ? "Últimas noticias" : "Destacadas por la redacción"}
            />
          </div>
        </div>
      </div>

      {/* Heavy ink rule + naranja hairline — comic masthead bar */}
      <div className="h-[3px] bg-ink" />
      <div className="h-[2px] bg-brand" />
    </header>
  );
}