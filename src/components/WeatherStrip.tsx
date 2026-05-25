import Link from "next/link";
import { TucumanWeather } from "@/lib/weather";

interface WeatherStripProps {
  weather: TucumanWeather | null;
}

export default function WeatherStrip({ weather }: WeatherStripProps) {
  if (!weather) return null;

  const { current, daily } = weather;
  const forecast = daily?.slice(1, 6) ?? [];

  return (
    <section className="bg-paper border-t-2 border-clima">
      {/* Title bar */}
      <div className="bg-clima text-white px-4 py-1.5 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xs font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]">
          Clima en Tucumán
        </span>
        <Link
          href="/clima"
          className="text-xs font-semibold text-white/90 hover:text-white transition-colors"
        >
          Pronóstico completo →
        </Link>
      </div>

      {/* Mobile layout — compact single row */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 md:hidden">
        <span className="text-xl shrink-0">{current.weatherIcon}</span>
        <span className="text-2xl font-bold font-[family-name:var(--font-heading)] text-ink leading-none shrink-0">
          {current.temperature}°
        </span>
        <span className="text-xs text-muted leading-tight shrink-0">
          {current.weatherDescription}
        </span>
        <div className="flex items-center gap-2 text-[11px] text-muted ml-auto">
          <span>Sensación {current.apparentTemperature}°</span>
          <span className="text-border">|</span>
          <span>{current.humidity}%</span>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 py-3 items-center gap-4">
        {/* Hoy label */}
        <div className="flex flex-col items-center shrink-0 max-w-[90px]">
          <span className="text-xl font-black font-[family-name:var(--font-heading)] text-clima leading-none">Hoy</span>
          <p className="text-xs text-muted leading-tight text-center">{current.weatherDescription}</p>
        </div>

        {/* Current temperature */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-4xl">{current.weatherIcon}</span>
          <span className="text-3xl font-bold font-[family-name:var(--font-heading)] text-ink leading-none">
            {current.temperature}°
          </span>
        </div>

        {/* Extended data */}
        <div className="flex items-center gap-3 text-xs text-muted shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-muted/60">Sensación</span>
            <span className="font-semibold text-ink">{current.apparentTemperature}°</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-muted/60">Humedad</span>
            <span className="font-semibold text-ink">{current.humidity}%</span>
          </div>
        </div>

        {/* Forecast 5 days */}
        <div className="flex items-stretch gap-1.5 ml-auto">
          {forecast.map((day) => (
            <div key={day.date} className="bg-ink/5 rounded px-4 py-2 text-center min-w-[80px]">
              <div className="flex items-center justify-between gap-2">
                <div className="text-left">
                  <p className="text-xs font-semibold text-ink leading-none">{day.dayName}</p>
                  <p className="text-[10px] text-muted/60 leading-tight">{day.date.slice(8, 10)}/{day.date.slice(5, 7)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl leading-none">{day.weatherIcon}</span>
                  <span className="text-sm font-semibold text-ink leading-none">
                    {day.tempMax}°<span className="text-muted">/{day.tempMin}°</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}