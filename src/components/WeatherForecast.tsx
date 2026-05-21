import type { DailyForecast } from "@/lib/weather";

interface WeatherForecastProps {
  daily: DailyForecast[];
}

export default function WeatherForecast({ daily }: WeatherForecastProps) {
  return (
    <section>
      <h2 className="text-lg font-bold font-[family-name:var(--font-heading)] mb-4">
        Pronóstico 7 días
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-visible">
        {daily.map((day) => (
          <div
            key={day.date}
            className="bg-paper p-3 rounded-sm border-t-2 border-clima text-center min-w-[80px] shrink-0"
          >
            <p className="text-xs font-bold text-muted uppercase tracking-wider">
              {day.dayName.slice(0, 3)}
            </p>
            <p className="text-2xl mt-1">{day.weatherIcon}</p>
            <p className="text-sm font-bold mt-1">{day.tempMax}°</p>
            <p className="text-xs text-muted">{day.tempMin}°</p>
          </div>
        ))}
      </div>
    </section>
  );
}