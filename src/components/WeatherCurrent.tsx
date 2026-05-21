import type { CurrentWeather, DailyForecast } from "@/lib/weather";

interface WeatherCurrentProps {
  current: CurrentWeather;
  today: DailyForecast;
}

export default function WeatherCurrent({ current, today }: WeatherCurrentProps) {
  return (
    <section>
      {/* Main temperature display */}
      <div className="flex items-start gap-4">
        <span className="text-6xl md:text-7xl">{current.weatherIcon}</span>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl md:text-7xl font-black tracking-tighter font-[family-name:var(--font-heading)] text-clima">
              {current.temperature}°
            </span>
          </div>
          <p className="text-lg md:text-xl font-semibold text-foreground mt-1">
            {current.weatherDescription}
          </p>
          <p className="text-sm text-muted mt-0.5">
            Hoy: {today.tempMax}° / {today.tempMin}°
          </p>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <DetailCard label="Sensación" value={`${current.apparentTemperature}°`} />
        <DetailCard label="Humedad" value={`${current.humidity}%`} />
        <DetailCard label="Viento" value={`${current.windSpeed} km/h`} />
        <DetailCard label="Precipitación" value={`${current.precipitation} mm`} />
      </div>
    </section>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper p-3 rounded-sm border-t-2 border-clima">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold font-[family-name:var(--font-heading)] mt-0.5">{value}</p>
    </div>
  );
}