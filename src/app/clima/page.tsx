import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import BreakingNews from "@/components/BreakingNews";
import Footer from "@/components/Footer";
import WeatherCurrent from "@/components/WeatherCurrent";
import WeatherForecast from "@/components/WeatherForecast";
import WeatherCities from "@/components/WeatherCities";
import { fetchCurrentWeather, fetchAllCitiesWeather } from "@/lib/weather";
import { getCachedBreakingNews } from "@/lib/sync-news";

export const revalidate = 600;

export const metadata = {
  title: "Clima - ¡QUE NOTICIA!",
  description: "Pronóstico del tiempo para San Miguel de Tucumán y las principales ciudades de Argentina.",
};

export default async function ClimaPage() {
  const [tucumanWeather, citiesWeather, breakingArticles] = await Promise.all([
    fetchCurrentWeather(),
    fetchAllCitiesWeather(),
    getCachedBreakingNews(),
  ]);

  return (
    <>
      <Header />
      <Navbar />
      <BreakingNews articles={breakingArticles ?? []} />

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-10">
        {/* Section-style header */}
        <div className="mb-6">
          <div className="border-l-4 pl-4 py-1 border-clima">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight font-[family-name:var(--font-heading)] text-clima">
              Clima
            </h1>
            <p className="mt-1 text-sm text-muted">
              Pronóstico del tiempo para San Miguel de Tucumán y Argentina
            </p>
          </div>
        </div>
        <div className="rule-thin mb-6" />

        {tucumanWeather && (
          <>
            <WeatherCurrent
              current={tucumanWeather.current}
              today={tucumanWeather.daily[0]}
            />
            <div className="rule-thin my-8" />
            <WeatherForecast daily={tucumanWeather.daily} />
          </>
        )}

        {citiesWeather.length > 0 && (
          <>
            <div className="rule-thin my-8" />
            <WeatherCities cities={citiesWeather} />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}