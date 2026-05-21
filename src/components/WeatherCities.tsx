import type { CityWeather } from "@/lib/weather";

interface WeatherCitiesProps {
  cities: CityWeather[];
}

export default function WeatherCities({ cities }: WeatherCitiesProps) {
  return (
    <section>
      <h2 className="text-lg font-bold font-[family-name:var(--font-heading)] mb-4">
        Clima en Argentina
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cities.map((city) => (
          <div
            key={city.name}
            className="bg-paper p-4 rounded-sm border-t-2 border-clima"
          >
            <p className="text-xs text-muted uppercase tracking-wider">{city.province}</p>
            <p className="text-sm font-bold font-[family-name:var(--font-heading)] mt-0.5">
              {city.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl">{city.current.weatherIcon}</span>
              <span className="text-xl font-black font-[family-name:var(--font-heading)] text-clima">
                {city.current.temperature}°
              </span>
            </div>
            <p className="text-xs text-muted mt-1">{city.current.weatherDescription}</p>
          </div>
        ))}
      </div>
    </section>
  );
}