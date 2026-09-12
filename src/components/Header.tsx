import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import WeatherBadge from "@/components/WeatherBadge";
import SocialLinks from "@/components/SocialLinks";
import HeaderFeaturedSlide from "@/components/HeaderFeaturedSlide";
import { fetchCurrentWeather, TUCUMAN_NAME } from "@/lib/weather";
import { getPortadaFeatured } from "@/lib/articles";

export default async function Header() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [weather, portadaFeatured] = await Promise.all([
    fetchCurrentWeather(),
    getPortadaFeatured(),
  ]);

  // Header slide: 1 por sección (excluida opinion), priorizando featured,
  // sin duplicar las del heroeditorial de la portada. Cacheado a 60s.
  const featured = portadaFeatured.headerSlide;
  const isFallback = false; // El helper ya maneja fallback internamente.

  return (
    <header className="bg-white text-white relative z-50" style={{ overflow: "visible" }}>
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
          </Link>

          {/* Slide de destacadas — llena el espacio sobrante del header */}
          <div className="flex-1 min-w-0">
            <HeaderFeaturedSlide
              articles={featured}
              title="Destacadas"
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