import type { SportsMatch, SportType } from "@/lib/types";

export type Tournament = "apertura" | "clausura";

/** Devuelve "hoy" en Argentina (UTC-3) como YYYY-MM-DD.
 *  new Date().toISOString() devuelve UTC → entre 21:00-00:00 ART salta al día
 *  siguiente y rompe currentTournament / currentMatchday. */
function artToday(): string {
  const now = new Date();
  // UTC-3 sin DST desde 2009. Restamos 3 horas al tiempo UTC y cortamos a YYYY-MM-DD.
  const art = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return art.toISOString().slice(0, 10);
}

/** Determina el torneo (Apertura/Clausura) al que pertenece un partido por mes.
 *  Apertura = primera mitad del año (mes 1-6), Clausura = segunda (mes 7-12).
 *  Convención LPF 2026: Apertura ene-jun, Clausura jul-nov. */
export function tournamentOf(matchDate: string): Tournament {
  const month = parseInt(matchDate.slice(5, 7), 10);
  return month <= 6 ? "apertura" : "clausura";
}

/** Torneo "actual": el que tiene partidos upcoming (scheduled/live) más cercanos a today.
 *  Si solo uno tiene upcoming → ese. Si ambos o ninguno → por mes del año. */
export function currentTournament(matches: SportsMatch[]): Tournament {
  const today = artToday();
  const aperturaUpcoming = matches.some(
    (m) =>
      tournamentOf(m.match_date) === "apertura" &&
      m.match_date >= today &&
      (m.status === "scheduled" || m.status === "live"),
  );
  const clausuraUpcoming = matches.some(
    (m) =>
      tournamentOf(m.match_date) === "clausura" &&
      m.match_date >= today &&
      (m.status === "scheduled" || m.status === "live"),
  );
  if (aperturaUpcoming && !clausuraUpcoming) return "apertura";
  if (clausuraUpcoming && !aperturaUpcoming) return "clausura";
  const month = parseInt(today.slice(5, 7), 10);
  return month <= 6 ? "apertura" : "clausura";
}

/** Filtra los partidos al torneo indicado. */
export function filterByTournament(
  matches: SportsMatch[],
  tournament: Tournament,
): SportsMatch[] {
  return matches.filter((m) => tournamentOf(m.match_date) === tournament);
}

/** Determina la matchday "actual" para un set de partidos:
 *  - La matchday cuyo rango de fechas (primero a último partido) contiene a today.
 *  - Si today > último partido de todas las jugadas → próxima matchday con scheduled.
 *  - Si today < primer partido → matchday 1.
 *  - Filtra por sport si se pasa.
 *  Pure function — safe para client components. */
export function currentMatchday(matches: SportsMatch[], sport?: SportType): number {
  const filtered = sport ? matches.filter((m) => m.sport === sport) : matches;
  if (filtered.length === 0) return 1;
  const today = artToday();

  // Agrupar por matchday con su rango de fechas
  const byMatchday = new Map<number, { min: string; max: string; hasUpcoming: boolean }>();
  for (const m of filtered) {
    const entry = byMatchday.get(m.matchday) ?? { min: m.match_date, max: m.match_date, hasUpcoming: false };
    if (m.match_date < entry.min) entry.min = m.match_date;
    if (m.match_date > entry.max) entry.max = m.match_date;
    if (m.status === "scheduled" || m.status === "live") entry.hasUpcoming = true;
    byMatchday.set(m.matchday, entry);
  }
  const sorted = Array.from(byMatchday.entries()).sort((a, b) => a[0] - b[0]);

  // 1. Matchday cuyo rango contiene a today
  for (const [md, range] of sorted) {
    if (today >= range.min && today <= range.max) return md;
  }
  // 2. Próxima matchday con upcoming (today < min de esa matchday)
  for (const [md, range] of sorted) {
    if (range.hasUpcoming && today < range.min) return md;
  }
  // 3. Si no hay upcoming, la última matchday
  return sorted[sorted.length - 1]?.[0] ?? 1;
}