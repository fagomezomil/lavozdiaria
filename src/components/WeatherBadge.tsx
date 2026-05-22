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
      className="flex items-center gap-1.5 text-white/75 font-medium text-[10px] sm:text-xs hover:text-[#0ea5e9] transition-colors"
      aria-label="Ver pronóstico del tiempo"
    >
      <span>{weatherIcon}</span>
      <span>{temperature}°</span>
      <span className="hidden sm:inline">{cityName}</span>
    </Link>
  );
}