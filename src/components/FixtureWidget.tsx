"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SportsMatch, SportType } from "@/lib/types";
import {
  BIG_TEAMS,
  artToday,
  currentMatchday,
  leagueOf,
  type FutbolLeagueId,
} from "@/lib/sports-utils";
import type { StandingRow } from "@/lib/sports";
import MatchCard from "./MatchCard";
import StandingsTable from "./StandingsTable";

interface FixtureWidgetProps {
  matches: SportsMatch[];
  /** Cuántos partidos mostrar por tab (default 5) */
  limit?: number;
  /** Tabla de posiciones LPF grupo A (top 5 widget) */
  standingsA?: StandingRow[];
  /** Tabla de posiciones LPF grupo B (top 5 widget) */
  standingsB?: StandingRow[];
  /** Tabla de posiciones PN Zona A (top 5 widget) */
  pnStandingsA?: StandingRow[];
  /** Tabla de posiciones PN Zona B (top 5 widget) */
  pnStandingsB?: StandingRow[];
}

type NonFutbolSport = Exclude<SportType, "futbol">;

/** Tabs del widget: ligas de fútbol + otros deportes, solo si hay partidos hoy. */
type TabId = FutbolLeagueId | NonFutbolSport;

const TAB_META: Record<TabId, string> = {
  lpf: "Fútbol",
  pn: "Primera Nacional",
  basquet: "Básquet",
  rugby: "Rugby",
};

const TAB_PATHS: Record<TabId, string> = {
  lpf: "/deportes/futbol",
  pn: "/deportes/futbol",
  basquet: "/deportes/basquet",
  rugby: "/deportes/rugby",
};

export default function FixtureWidget({
  matches,
  limit = 5,
  standingsA,
  standingsB,
  pnStandingsA,
  pnStandingsB,
}: FixtureWidgetProps) {
  // Tabs disponibles según la data (solo deportes/ligas con partidos activos hoy)
  const availableTabs = useMemo(() => {
    const tabs: TabId[] = [];
    if (matches.some((m) => leagueOf(m) === "lpf")) tabs.push("lpf");
    if (matches.some((m) => leagueOf(m) === "pn")) tabs.push("pn");
    for (const s of ["basquet", "rugby"] as NonFutbolSport[]) {
      if (matches.some((m) => m.sport === s)) tabs.push(s);
    }
    return tabs;
  }, [matches]);

  const [active, setActive] = useState<TabId>(availableTabs[0] || "lpf");

  // Pool de la tab activa (liga completa, sin sub-filtro de torneo).
  const pool = useMemo(() => {
    if (active === "lpf" || active === "pn") {
      return matches.filter((m) => leagueOf(m) === active);
    }
    return matches.filter((m) => m.sport === active);
  }, [matches, active]);

  // Fútbol: prioriza los 4 equipos grandes (River, Boca, Atl. y San Martín Tucumán),
  // próximos ordenados por fecha; si ninguno tiene próximo, cae a la fecha actual.
  const visible = useMemo(() => {
    if (pool.length === 0) return [];
    const sportOf = active === "lpf" || active === "pn" ? "futbol" : active;
    const byKickoff = (a: SportsMatch, b: SportsMatch) =>
      (a.kickoff_at || a.match_date).localeCompare(b.kickoff_at || b.match_date);
    if (active === "lpf" || active === "pn") {
      const today = artToday();
      const big = pool
        .filter(
          (m) =>
            (BIG_TEAMS.includes(m.home_team) || BIG_TEAMS.includes(m.away_team)) &&
            (m.status === "scheduled" || m.status === "live") &&
            m.match_date >= today,
        )
        .sort(byKickoff);
      if (big.length > 0) return big.slice(0, limit);
    }
    const md = currentMatchday(pool, sportOf);
    return pool.filter((m) => m.matchday === md).sort(byKickoff).slice(0, limit);
  }, [pool, active, limit]);

  const tournamentName =
    active === "pn"
      ? "Primera Nacional"
      : pool[0]?.tournament || matches.find((m) => leagueOf(m) === "lpf")?.tournament || "";

  // Título: "Fecha N" solo si los partidos visibles son de una misma fecha
  const sharedMatchday =
    visible.length > 0 && new Set(visible.map((m) => m.matchday)).size === 1
      ? visible[0].matchday
      : null;

  if (availableTabs.length === 0) {
    return (
      <div className="border-2 border-ink bg-paper shadow-hard-sm p-4">
        <p className="text-xs text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide">
          No hay partidos cargados
        </p>
      </div>
    );
  }

  // Standings de la tab activa (LPF: Grupo A/B — PN: Zona A/B)
  const standings =
    active === "pn"
      ? { a: pnStandingsA, b: pnStandingsB, labelA: "Zona A", labelB: "Zona B" }
      : { a: standingsA, b: standingsB, labelA: "Grupo A", labelB: "Grupo B" };

  return (
    <div className="border-2 border-ink bg-paper shadow-hard-sm sticky top-4">
      {/* Header negro */}
      <div className="bg-ink text-paper px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.18em] opacity-60 font-[family-name:var(--font-heading)] truncate">
              {tournamentName || "Fixture"}
            </p>
            <h2 className="text-base font-bold font-[family-name:var(--font-heading)] leading-tight truncate" style={{ textTransform: "none" }}>
              {sharedMatchday ? `Fecha ${sharedMatchday}` : "Próximos partidos"}
            </h2>
          </div>
          <Link
            href={TAB_PATHS[active]}
            className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand hover:text-paper transition-colors whitespace-nowrap"
          >
            Ver todos →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      {availableTabs.length > 1 && (
        <div className="flex border-b-2 border-ink">
          {availableTabs.map((s) => {
            const isActive = s === active;
            return (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`flex-1 py-1.5 uppercase font-semibold font-[family-name:var(--font-heading)] transition-colors ${
                  availableTabs.length > 3 ? "text-[10px] tracking-[0.08em]" : "text-[11px] tracking-[0.14em]"
                } ${
                  isActive
                    ? "bg-brand text-ink border-b-2 border-brand"
                    : "bg-paper text-muted hover:text-ink hover:bg-ink/5"
                }`}
              >
                {TAB_META[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Matches list */}
      <div>
        {visible.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide">
            No hay próximos partidos
          </p>
        ) : (
          visible.map((m) => <MatchCard key={`${m.sport}-${m.match_id}`} match={m} variant="row" />)
        )}
      </div>

      {/* Standings: top 5 de cada tabla + ver todos */}
      {((standings.a && standings.a.length > 0) || (standings.b && standings.b.length > 0)) && (
        <>
          {standings.a && standings.a.length > 0 && (
            <StandingsTable rows={standings.a} limit={5} variant="compact" title={standings.labelA} />
          )}
          {standings.b && standings.b.length > 0 && (
            <StandingsTable rows={standings.b} limit={5} variant="compact" title={standings.labelB} />
          )}
          <Link
            href="/deportes/futbol"
            className="block bg-ink text-paper text-[10px] uppercase tracking-[0.14em] font-bold text-center py-2 hover:bg-brand hover:text-ink transition-colors font-[family-name:var(--font-heading)]"
          >
            Ver todos →
          </Link>
        </>
      )}
    </div>
  );
}