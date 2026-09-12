"use client";

import type { SportsMatch } from "@/lib/types";
import { teamLogo } from "@/lib/team-logos";

const WD_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Códigos aeropuerto por ciudad (3 letras, ahorro de espacio en header de card). */
const CITY_CODES: Record<string, string> = {
  "buenos aires": "BUE", "avellaneda": "BUE", "victoria": "BUE", "florencio varela": "BUE",
  "la plata": "LPA", "cordoba": "COR", "mendoza": "MDZ", "godoy cruz": "MDZ",
  "santiago del estero": "SDE", "tucuman": "TUC", "san miguel de tucuman": "TUC",
  "rosario": "ROS", "mar del plata": "MDQ", "salta": "SAL", "jujuy": "JUJ",
  "neuquen": "NQN", "resistencia": "RES", "formosa": "FMA", "bahia blanca": "BHI",
  "comodoro rivadavia": "CRD", "rio gallegos": "RGL", "ushuaia": "USH", "trelew": "REL",
  "bariloche": "BRC", "san juan": "SJU", "catamarca": "CTC", "la rioja": "IRJ",
  "santa fe": "SFN", "parana": "PRA", "posadas": "PSS", "corrientes": "CNQ",
  "santiago": "SCL", "lima": "LIM", "la paz": "LPB", "montevideo": "MVD",
  "sao paulo": "GRU", "rio de janeiro": "RIO", "porto alegre": "POA",
  "belo horizonte": "CNF", "brasilia": "BSB", "curitiba": "CWB", "fortaleza": "FOR",
  "recife": "REC", "salvador": "SSA", "cuiaba": "CGB", "manaus": "MAO", "goiania": "GYN",
  "quito": "UIO", "bogota": "BOG", "medellin": "MDE", "cali": "CLO", "cucuta": "CUC",
  "caracas": "CCS", "guayaquil": "GYE", "asuncion": "ASU",
};

/** Ciudad → código 3 letras (diccionario aeropuerto; fallback: primeras 3 letras). */
function cityCode(city?: string | null): string | null {
  if (!city) return null;
  const key = city.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (CITY_CODES[key]) return CITY_CODES[key];
  return city.trim().slice(0, 3).toUpperCase();
}

/** Nombre corto del equipo: primeras 2 palabras; si la 2da es preposición/artículo, solo la 1ra. */
function shortTeamName(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2 && ["de", "del", "la", "el", "los", "las"].includes(words[1].toLowerCase())) {
    return words[0];
  }
  return words.slice(0, 2).join(" ");
}

function fmtDate(iso: string): string {
  // "2026-09-07" → "Sáb 07 Sep"
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${WD_SHORT[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]}`;
}

function StatusBadge({ status, time }: { status: string; time?: string | null }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] font-bold text-live">
        <span className="w-1.5 h-1.5 bg-live rounded-full animate-pulse" />
        En vivo
      </span>
    );
  }
  if (status === "played") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] font-semibold text-muted">
        <span className="w-1.5 h-1.5 bg-ink rounded-full" />
        Final
      </span>
    );
  }
  if (status === "postponed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] font-semibold text-muted">
        <span className="w-1.5 h-1.5 bg-muted rounded-full" />
        Postergado
      </span>
    );
  }
  // scheduled
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] font-semibold text-brand">
      <span className="w-1.5 h-1.5 bg-brand rounded-full" />
      {time || "A confirmar"}
    </span>
  );
}

/** Badge del equipo: escudo desde R2 (team-logos) o fallback a círculo de iniciales. */
function TeamBadge({ team, color, initials, size }: { team: string; color: string; initials: string; size: "sm" | "lg" }) {
  const logo = teamLogo(team);
  const box = size === "lg" ? "w-11 h-11" : "w-[30px] h-[30px]";
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={team}
        width={size === "lg" ? 44 : 30}
        height={size === "lg" ? 44 : 30}
        loading="lazy"
        className={`${box} object-contain flex-shrink-0`}
      />
    );
  }
  return (
    <span
      className={`${box} rounded-full border flex items-center justify-center font-bold text-white flex-shrink-0 font-[family-name:var(--font-heading)] ${
        size === "lg" ? "border-2 border-ink text-[11px]" : "border border-ink text-[10px]"
      }`}
      style={{ background: color, ...(size === "lg" ? { boxShadow: "2px 2px 0 var(--color-ink)" } : {}) }}
    >
      {initials}
    </span>
  );
}

interface MatchCardProps {
  match: SportsMatch;
  variant?: "row" | "card" | "vertical";
}

export default function MatchCard({ match, variant = "row" }: MatchCardProps) {
  const colors = match.team_colors || { home: "#6b6358", away: "#6b6358" };
  const initials = match.team_initials || { home: "???", away: "???" };

  if (variant === "vertical") {
    // Vertical compacta — portada (grid 5 cols): header azul deportes (fecha·hora·ciudad)
    // + escudos con nombre a 2 líneas. Sin paddings internos extra: el header absorbe el ancho.
    const city = cityCode(match.city);
    return (
      <div
        className={`relative border-2 border-ink shadow-hard-sm flex flex-col ${
          match.status === "live" ? "bg-live/5" : ""
        } ${match.is_local_tucuman ? "bg-gradient-to-br from-paper to-brand/10" : ""}`}
      >
        {/* Header azul deportes */}
        <div className="bg-deportes text-white px-2.5 py-1.5 flex items-center justify-between gap-1 text-[11px] uppercase tracking-[0.12em] font-semibold font-[family-name:var(--font-heading)] whitespace-nowrap">
          <span className="truncate">{fmtDate(match.match_date)} · {match.status === "live" ? "En vivo" : match.time || "A conf."}</span>
          <span className="truncate">{city || ""}</span>
        </div>

        {/* Cuerpo: escudos + nombres */}
        <div className="flex-1 bg-paper grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 p-2">
          {/* Home */}
          <div className="flex flex-col items-center min-w-0 gap-1.5">
            <TeamBadge team={match.home_team} color={colors.home} initials={initials.home} size="lg" />
            <span className="text-[14px] font-semibold font-[family-name:var(--font-heading)] leading-tight text-center line-clamp-2 min-h-[2.6em] max-w-full" style={{ textTransform: "none" }}>
              {shortTeamName(match.home_team)}
            </span>
          </div>
          {/* Score / vs */}
          <div className="font-[family-name:var(--font-heading)] font-bold text-[15px] text-ink whitespace-nowrap">
            {match.status === "scheduled" ? (
              <span className="text-muted text-[13px] font-medium tracking-wide uppercase">vs</span>
            ) : (
              <span>
                {match.home_score ?? 0}
                <span className="text-muted mx-0.5">-</span>
                {match.away_score ?? 0}
              </span>
            )}
          </div>
          {/* Away */}
          <div className="flex flex-col items-center min-w-0 gap-1.5">
            <TeamBadge team={match.away_team} color={colors.away} initials={initials.away} size="lg" />
            <span className="text-[14px] font-semibold font-[family-name:var(--font-heading)] leading-tight text-center line-clamp-2 min-h-[2.6em] max-w-full" style={{ textTransform: "none" }}>
              {shortTeamName(match.away_team)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "row") {
    // Compact row — for sidebar widget
    return (
      <div
        className={`relative px-3 py-2.5 border-b border-ink/10 last:border-b-0 ${
          match.status === "live" ? "bg-live/5" : ""
        } ${match.is_local_tucuman ? "bg-brand/5" : ""}`}
      >
        {match.is_local_tucuman && (
          <span className="absolute top-1 right-2 text-[8px] uppercase tracking-[0.16em] font-bold text-brand font-[family-name:var(--font-heading)]">
            TUC
          </span>
        )}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[12px] uppercase tracking-[0.14em] font-semibold text-muted font-[family-name:var(--font-heading)]">
            {fmtDate(match.match_date)}
          </span>
          {match.status === "live" && (
            <span className="text-[12px] uppercase tracking-[0.14em] font-bold text-live font-[family-name:var(--font-heading)]">
              · En vivo
            </span>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Home */}
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamBadge team={match.home_team} color={colors.home} initials={initials.home} size="sm" />
            <span className="text-[13px] font-semibold font-[family-name:var(--font-heading)] truncate" style={{ textTransform: "none" }}>
              {match.home_team}
            </span>
          </div>
          {/* Score / vs */}
          <div className="font-[family-name:var(--font-heading)] font-bold text-[13px] text-ink px-1 whitespace-nowrap">
            {match.status === "scheduled" ? (
              <span className="text-muted text-[13px] font-medium tracking-wide">vs</span>
            ) : (
              <span>{match.home_score ?? 0}<span className="text-muted mx-0.5">-</span>{match.away_score ?? 0}</span>
            )}
          </div>
          {/* Away */}
          <div className="flex items-center gap-1.5 min-w-0 flex-row-reverse text-right">
            <TeamBadge team={match.away_team} color={colors.away} initials={initials.away} size="sm" />
            <span className="text-[13px] font-semibold font-[family-name:var(--font-heading)] truncate" style={{ textTransform: "none" }}>
              {match.away_team}
            </span>
          </div>
        </div>
        {match.time && match.status === "scheduled" && (
          <p className="mt-1 text-[12px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide">
            {match.time} · {match.city || match.stadium || ""}
          </p>
        )}
      </div>
    );
  }

  // Card variant — for full grid (mockup-style)
  return (
    <div
      className={`relative border-2 border-ink bg-paper shadow-hard-sm p-4 ${
        match.status === "live" ? "bg-live/5" : ""
      } ${match.is_local_tucuman ? "bg-gradient-to-br from-paper to-brand/10" : ""}`}
    >
      <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-[0.14em] font-[family-name:var(--font-heading)]">
        <span className="font-semibold text-ink">{fmtDate(match.match_date)}</span>
        <span className="text-muted truncate ml-2 max-w-[55%]">{match.stadium || match.city}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Home */}
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge team={match.home_team} color={colors.home} initials={initials.home} size="lg" />
          <span className="text-[15px] font-semibold font-[family-name:var(--font-heading)] truncate" style={{ textTransform: "none" }}>
            {match.home_team}
          </span>
        </div>
        {/* Score */}
        <div className="font-[family-name:var(--font-heading)] font-bold text-[22px] text-ink whitespace-nowrap">
          {match.status === "scheduled" ? (
            <span className="text-muted text-[13px] font-medium tracking-wide uppercase">vs</span>
          ) : (
            <span>
              {match.home_score ?? 0}
              <span className="text-muted mx-1">-</span>
              {match.away_score ?? 0}
            </span>
          )}
        </div>
        {/* Away */}
        <div className="flex items-center gap-2 min-w-0 flex-row-reverse text-right">
          <TeamBadge team={match.away_team} color={colors.away} initials={initials.away} size="lg" />
          <span className="text-[15px] font-semibold font-[family-name:var(--font-heading)] truncate" style={{ textTransform: "none" }}>
            {match.away_team}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-dashed border-ink/20 flex items-center justify-between">
        <StatusBadge status={match.status} time={match.time} />
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted font-[family-name:var(--font-heading)] truncate ml-2">
          {match.city}
        </span>
      </div>
    </div>
  );
}