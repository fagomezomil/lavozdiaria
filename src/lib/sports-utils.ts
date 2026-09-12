import type { SportsMatch, SportType } from "@/lib/types";

/** Ligas de fútbol con fixture en el sitio.
 *  LPF usa Apertura/Clausura (por mes); Primera Nacional (Nacional B) es
 *  temporada única por zonas. */
export const FUTBOL_LEAGUES = [
  { id: "lpf", label: "Liga Profesional", dbTournament: "Liga Profesional" },
  { id: "pn", label: "Primera Nacional", dbTournament: "Primera Nacional" },
] as const;

export type FutbolLeagueId = (typeof FUTBOL_LEAGUES)[number]["id"];

/** Liga de un partido: PN por tournament="Primera Nacional"; resto de futbol → LPF. */
export function leagueOf(m: SportsMatch): FutbolLeagueId | null {
  if (m.sport !== "futbol") return null;
  return m.tournament === "Primera Nacional" ? "pn" : "lpf";
}

/** Equipos que prioriza el widget de portada (interés local + grandeza). */
export const BIG_TEAMS = ["River Plate", "Boca Juniors", "Atlético Tucumán", "San Martín Tucumán"];

/** Devuelve "hoy" en Argentina (UTC-3) como YYYY-MM-DD.
 *  new Date().toISOString() devuelve UTC → entre 21:00-00:00 ART salta al día
 *  siguiente y rompe currentMatchday. */
export function artToday(): string {
  const now = new Date();
  // UTC-3 sin DST desde 2009. Restamos 3 horas al tiempo UTC y cortamos a YYYY-MM-DD.
  const art = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return art.toISOString().slice(0, 10);
}

/** Determina la matchday "actual" para un set de partidos:
 *  1. El próximo partido real (scheduled/live desde hoy) define la fecha en curso.
 *     Por rangos de matchday NO: los postergados viejos (matchday con rango que
 *     cruza meses, ej. fecha 21 jul→sep) hacían caer el default en una pasada.
 *  2. Sin upcoming: la matchday que tenga partidos hoy.
 *  3. Temporada terminada: la última matchday con partidos.
 *  Pure function — safe para client components. */
export function currentMatchday(matches: SportsMatch[], sport?: SportType): number {
  const filtered = sport ? matches.filter((m) => m.sport === sport) : matches;
  if (filtered.length === 0) return 1;
  const today = artToday();

  const upcoming = filtered
    .filter((m) => (m.status === "scheduled" || m.status === "live") && m.match_date >= today)
    .sort((a, b) => (a.kickoff_at || a.match_date).localeCompare(b.kickoff_at || b.match_date));
  if (upcoming.length > 0) return upcoming[0].matchday;

  const todayMatch = filtered.find((m) => m.match_date === today);
  if (todayMatch) return todayMatch.matchday;

  return Math.max(...filtered.map((m) => m.matchday));
}