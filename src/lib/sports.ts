import { createPublicClient } from "@/lib/supabase/server";
import type { SportsMatch, SportType } from "@/lib/types";

export interface StandingRow {
  team: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  /** Colores e iniciales del badge, si están en sports_matches */
  color?: string;
  initials?: string;
}

export type StandingsGroup = "A" | "B";

/** Mapa equipo → grupo (Liga Profesional 2026, zonas fijas Apertura+Clausura).
 *  Nombres canónicos usados por el scraper (matchesio). */
export const TEAM_GROUPS: Record<string, StandingsGroup> = {
  // Grupo A (15)
  "Instituto Córdoba": "A",
  "Gimnasia M.": "A",
  "Defensa Y Justicia": "A",
  "Vélez Sarsfield": "A",
  "Newells Old Boys": "A",
  "Unión Santa Fe": "A",
  "Independiente": "A",
  "Boca Juniors": "A",
  "Deportivo Riestra": "A",
  "Platense": "A",
  "Estudiantes L.P.": "A",
  "Lanus": "A",
  "Central Córdoba": "A",
  "San Lorenzo": "A",
  "Talleres Córdoba": "A",
  // Grupo B (15)
  "Argentinos JRS": "B",
  "Tigre": "B",
  "Sarmiento Junín": "B",
  "Gimnasia L.P.": "B",
  "Belgrano Córdoba": "B",
  "Independ. Rivadavia": "B",
  "Rosario Central": "B",
  "Atlético Tucumán": "B",
  "Barracas Central": "B",
  "Huracan": "B",
  "River Plate": "B",
  "Banfield": "B",
  "Estudiantes de Rio Cuarto": "B",
  "Racing Club": "B",
  "Aldosivi": "B",
};

export function teamGroup(team: string): StandingsGroup | undefined {
  return TEAM_GROUPS[team];
}

/** Mapa equipo → zona (Primera Nacional 2026: 2 zonas de 18, sorteo AFA 22/12/2025).
 *  Nombres canónicos post-alias del scraper. Los interzonales (fechas 7 y 25)
 *  SÍ suman en las tablas de zona — ver getStandings. */
export const TEAM_GROUPS_PN: Record<string, StandingsGroup> = {
  // Zona A (18)
  "All Boys": "A",
  "Ferro Carril Oeste": "A",
  "Deportivo Madryn": "A",
  "Chaco For Ever": "A",
  "Deportivo Morón": "A",
  "Estudiantes (BA)": "A",
  "Racing Córdoba": "A",
  "Los Andes": "A",
  "Atlético Mitre": "A",
  "Almirante Brown": "A",
  "Ciudad de Bolívar": "A",
  "Colón Santa Fe": "A",
  "Central Norte": "A",
  "Godoy Cruz": "A",
  "San Telmo": "A",
  "San Miguel": "A",
  "Defensores de Belgrano": "A",
  "Acassuso": "A",
  // Zona B (18)
  "Nueva Chicago": "B",
  "Chacarita Juniors": "B",
  "Atlanta": "B",
  "San Martín Tucumán": "B",
  "Gimnasia Jujuy": "B",
  "Almagro": "B",
  "San Martín S.J.": "B",
  "Temperley": "B",
  "Club Atlético Güemes": "B",
  "Tristán Suárez": "B",
  "Agropecuario": "B",
  "Patronato": "B",
  "Gimnasia y Tiro": "B",
  "Deportivo Maipú": "B",
  "Quilmes": "B",
  "Colegiales": "B",
  "Atlético Rafaela": "B",
  "Midland": "B",
};

export function teamGroupPn(team: string): StandingsGroup | undefined {
  return TEAM_GROUPS_PN[team];
}

export interface StandingsOpts {
  /** Filtro por torneo en DB (ej. "Liga Profesional" | "Primera Nacional"). */
  tournament?: string;
}

/** Calcula la tabla de posiciones desde los partidos jugados de un deporte.
 *  3 pts partido ganado, 1 empate, 0 perdido. Orden: pts desc, dg desc, gf desc.
 *  Con `group`:
 *  - LPF: solo partidos donde AMBOS equipos son del grupo (excluye interzonales).
 *  - Primera Nacional 2026: los interzonales (fechas 7 y 25) SÍ suman en las
 *    tablas de zona (verificado: PJ 28 tras la fecha 28) — cada partido aporta
 *    solo a la fila del equipo de la zona pedida. */
export async function getStandings(
  sport: SportType,
  group?: StandingsGroup,
  opts?: StandingsOpts,
): Promise<StandingRow[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("sports_matches")
    .select("home_team,away_team,home_score,away_score,status,team_colors,team_initials")
    .eq("sport", sport)
    .eq("status", "played");
  if (opts?.tournament) query = query.eq("tournament", opts.tournament);
  const { data, error } = await query;
  if (error) {
    console.error("getStandings error:", error.message);
    return [];
  }

  const isPn = opts?.tournament === "Primera Nacional";
  const teamGroupFor = isPn ? teamGroupPn : teamGroup;

  const teams = new Map<string, StandingRow & { color?: string; initials?: string }>();
  for (const m of data ?? []) {
    const h = m.home_team as string;
    const a = m.away_team as string;
    const hs = m.home_score as number | null;
    const as = m.away_score as number | null;
    if (hs == null || as == null) continue;

    // ¿Este partido suma a la tabla del grupo pedido?
    let countHome = true;
    let countAway = true;
    if (group) {
      if (isPn) {
        // PN: cada equipo suma solo si pertenece a la zona pedida (interzonales cuentan)
        countHome = teamGroupFor(h) === group;
        countAway = teamGroupFor(a) === group;
      } else {
        // LPF: ambos equipos del grupo (excluye interzonales)
        const sameGroup = teamGroupFor(h) === group && teamGroupFor(a) === group;
        countHome = sameGroup;
        countAway = sameGroup;
      }
      if (!countHome && !countAway) continue;
    }

    const getTeam = (name: string) => {
      if (!teams.has(name)) {
        teams.set(name, { team: name, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
      }
      return teams.get(name)!;
    };

    const apply = (row: StandingRow, gf: number, ga: number) => {
      row.pj += 1; row.gf += gf; row.gc += ga;
      if (gf > ga) { row.pg += 1; row.pts += 3; }
      else if (gf < ga) { row.pp += 1; }
      else { row.pe += 1; row.pts += 1; }
    };

    if (countHome) {
      const home = getTeam(h);
      if (m.team_colors && !home.color) home.color = (m.team_colors as { home: string }).home;
      if (m.team_initials && !home.initials) home.initials = (m.team_initials as { home: string }).home;
      apply(home, hs, as);
    }
    if (countAway) {
      const away = getTeam(a);
      if (m.team_colors && !away.color) away.color = (m.team_colors as { away: string }).away;
      if (m.team_initials && !away.initials) away.initials = (m.team_initials as { away: string }).away;
      apply(away, as, hs);
    }
  }

  // Calcular DG y ordenar
  const rows = Array.from(teams.values()).map((t) => ({ ...t, dg: t.gf - t.gc }));
  rows.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
  return rows;
}

/** Trae partidos activos de sports_matches.
 *  - Filtra por sport si se pasa.
 *  - Ordena por match_date ascendente.
 *  - Solo activos. */
export async function getSportsMatches(sport?: string): Promise<SportsMatch[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("sports_matches")
    .select("*")
    .eq("active", true)
    .order("match_date", { ascending: true });
  if (sport) query = query.eq("sport", sport);
  const { data, error } = await query;
  if (error) {
    console.error("getSportsMatches error:", error.message);
    return [];
  }
  return (data ?? []) as SportsMatch[];
}

/** Trae todos los partidos de un deporte (sin filtro active), agrupados por fecha.
 *  Para la página de fixture completo. */
export async function getSportsMatchesBySport(sport: string): Promise<SportsMatch[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("sports_matches")
    .select("*")
    .eq("sport", sport)
    .order("match_date", { ascending: true })
    .order("time", { ascending: true });
  if (error) {
    console.error("getSportsMatchesBySport error:", error.message);
    return [];
  }
  return (data ?? []) as SportsMatch[];
}