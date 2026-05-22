import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import WeatherBadge from "@/components/WeatherBadge";
import SocialLinks from "@/components/SocialLinks";
import { fetchCurrentWeather, TUCUMAN_NAME } from "@/lib/weather";

export default async function Header() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const weather = await fetchCurrentWeather();

  return (
    <header className="bg-ink text-white" style={{ overflow: "visible" }}>
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs tracking-wider uppercase text-muted" style={{ overflow: "visible", position: "relative", zIndex: 60 }}>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline">{today}</span>
          {weather && (
            <WeatherBadge
              temperature={weather.current.temperature}
              weatherIcon={weather.current.weatherIcon}
              cityName={TUCUMAN_NAME}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          <SocialLinks />
          <HeaderAuth />
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-center border-t border-white/10">
        <Link href="/" className="group inline-block">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-heading)] group-hover:opacity-80 transition-opacity">
            La<span className="text-[#c8102e]">Voz</span>Diaria
          </h1>
          <p className="mt-1 text-xs tracking-[0.35em] uppercase text-white/70 group-hover:text-white transition-colors">
            Noticias · Análisis · Verdad
          </p>
        </Link>
      </div>
    </header>
  );
}