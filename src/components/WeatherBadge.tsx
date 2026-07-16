import Link from "next/link";

interface WeatherBadgeProps {
  temperature: number;
  weatherIcon: string;
  cityName: string;
}

export default function WeatherBadge({ temperature, weatherIcon, cityName }: WeatherBadgeProps) {
  return (
    <Link
      href="/clima"
      className="flex items-center gap-1.5 text-orange-600 font-[family-name:var(--font-heading)] font-semibold text-[10px] sm:text-xs uppercase tracking-wider hover:text-brand transition-colors"
      aria-label="Ver pronóstico del tiempo"
    >
      <span>{weatherIcon}</span>
      <span>{temperature}°</span>
      <span className="hidden sm:inline">{cityName}</span>
    </Link>
  );
}