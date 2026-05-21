// Weather data layer — Open-Meteo API (free, no key, non-commercial)

export const TUCUMAN_LAT = -26.8023;
export const TUCUMAN_LON = -65.2178;
export const TUCUMAN_NAME = "S. M. de Tucumán";

export const OTHER_CITIES = [
  { name: "Buenos Aires", province: "CABA", lat: -34.6037, lon: -58.3816 },
  { name: "Córdoba", province: "Córdoba", lat: -31.4201, lon: -64.1888 },
  { name: "Rosario", province: "Santa Fe", lat: -32.9468, lon: -60.6393 },
  { name: "Mendoza", province: "Mendoza", lat: -32.8895, lon: -68.8458 },
  { name: "Salta", province: "Salta", lat: -24.7829, lon: -65.4232 },
  { name: "Neuquén", province: "Neuquén", lat: -38.9516, lon: -68.0591 },
  { name: "Mar del Plata", province: "Buenos Aires", lat: -38.0004, lon: -57.5562 },
  { name: "Corrientes", province: "Corrientes", lat: -27.4806, lon: -58.8341 },
];

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
}

export interface TucumanWeather {
  current: CurrentWeather;
  daily: DailyForecast[];
}

export interface CityWeather {
  name: string;
  province: string;
  current: CurrentWeather;
}

const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Cielo despejado", icon: "☀️" },
  1: { description: "Mayormente despejado", icon: "🌤️" },
  2: { description: "Parcialmente nublado", icon: "⛅" },
  3: { description: "Nublado", icon: "☁️" },
  45: { description: "Niebla", icon: "🌫️" },
  48: { description: "Niebla con escarcha", icon: "🌫️" },
  51: { description: "Llovizna ligera", icon: "🌦️" },
  53: { description: "Llovizna moderada", icon: "🌦️" },
  55: { description: "Llovizna intensa", icon: "🌧️" },
  61: { description: "Lluvia ligera", icon: "🌧️" },
  63: { description: "Lluvia moderada", icon: "🌧️" },
  65: { description: "Lluvia intensa", icon: "🌧️" },
  66: { description: "Lluvia helada ligera", icon: "🌧️" },
  67: { description: "Lluvia helada intensa", icon: "🌧️" },
  71: { description: "Nieve ligera", icon: "🌨️" },
  73: { description: "Nieve moderada", icon: "🌨️" },
  75: { description: "Nieve intensa", icon: "❄️" },
  77: { description: "Granizo", icon: "❄️" },
  80: { description: "Lluvias aisladas", icon: "🌦️" },
  81: { description: "Lluvias dispersas", icon: "🌦️" },
  82: { description: "Lluvias fuertes", icon: "⛈️" },
  85: { description: "Nieve aislada", icon: "🌨️" },
  86: { description: "Nieve intensa aislada", icon: "🌨️" },
  95: { description: "Tormenta", icon: "⛈️" },
  96: { description: "Tormenta con granizo", icon: "⛈️" },
  99: { description: "Tormenta con granizo fuerte", icon: "⛈️" },
};

export function getWmoInfo(code: number): { description: string; icon: string } {
  return WMO_CODES[code] || { description: "Desconocido", icon: "🌡️" };
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_NAMES[d.getDay()];
}

interface OpenMeteoCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  precipitation: number;
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
}

const REVALIDATE = 600; // 10 minutes

export async function fetchCurrentWeather(): Promise<TucumanWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${TUCUMAN_LAT}&longitude=${TUCUMAN_LON}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=America/Argentina/Buenos_Aires&forecast_days=7`;

    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;

    const data: OpenMeteoResponse = await res.json();
    const wmo = getWmoInfo(data.current.weather_code);

    const current: CurrentWeather = {
      temperature: Math.round(data.current.temperature_2m),
      apparentTemperature: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      weatherDescription: wmo.description,
      weatherIcon: wmo.icon,
    };

    const daily: DailyForecast[] = data.daily.time.map((date, i) => {
      const dwmo = getWmoInfo(data.daily.weather_code[i]);
      return {
        date,
        dayName: getDayName(date),
        weatherCode: data.daily.weather_code[i],
        weatherDescription: dwmo.description,
        weatherIcon: dwmo.icon,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipitationSum: data.daily.precipitation_sum[i],
      };
    });

    return { current, daily };
  } catch {
    return null;
  }
}

export async function fetchAllCitiesWeather(): Promise<CityWeather[]> {
  const results = await Promise.all(
    OTHER_CITIES.map(async (city) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&timezone=America/Argentina/Buenos_Aires`;
        const res = await fetch(url, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return null;

        const data = await res.json();
        const wmo = getWmoInfo(data.current.weather_code);

        return {
          name: city.name,
          province: city.province,
          current: {
            temperature: Math.round(data.current.temperature_2m),
            apparentTemperature: 0,
            humidity: 0,
            windSpeed: 0,
            precipitation: 0,
            weatherCode: data.current.weather_code,
            weatherDescription: wmo.description,
            weatherIcon: wmo.icon,
          },
        } as CityWeather;
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is CityWeather => r !== null);
}