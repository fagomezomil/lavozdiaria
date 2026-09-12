"use client";

import type { SportsMatch } from "@/lib/types";

const WD_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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

interface MatchCardProps {
  match: SportsMatch;
  variant?: "row" | "card";
}

export default function MatchCard({ match, variant = "row" }: MatchCardProps) {
  const colors = match.team_colors || { home: "#6b6358", away: "#6b6358" };
  const initials = match.team_initials || { home: "???", away: "???" };

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
          <span className="text-[9px] uppercase tracking-[0.14em] font-semibold text-muted font-[family-name:var(--font-heading)]">
            {fmtDate(match.match_date)}
          </span>
          {match.status === "live" && (
            <span className="text-[9px] uppercase tracking-[0.14em] font-bold text-live font-[family-name:var(--font-heading)]">
              · En vivo
            </span>
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Home */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-6 h-6 rounded-full border border-ink flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 font-[family-name:var(--font-heading)]"
              style={{ background: colors.home }}
            >
              {initials.home}
            </span>
            <span className="text-[11px] font-semibold font-[family-name:var(--font-heading)] truncate" style={{ textTransform: "none" }}>
              {match.home_team}
            </span>
          </div>
          {/* Score / vs */}
          <div className="font-[family-name:var(--font-heading)] font-bold text-[13px] text-ink px-1 whitespace-nowrap">
            {match.status === "scheduled" ? (
              <span className="text-muted text-[10px] font-medium tracking-wide">vs</span>
            ) : (
              <span>{match.home_score ?? 0}<span className="text-muted mx-0.5">-</span>{match.away_score ?? 0}</span>
            )}
          </div>
          {/* Away */}
          <div className="flex items-center gap-1.5 min-w-0 flex-row-reverse text-right">
            <span
              className="w-6 h-6 rounded-full border border-ink flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 font-[family-name:var(--font-heading)]"
              style={{ background: colors.away }}
            >
              {initials.away}
            </span>
            <span className="text-[11px] font-semibold font-[family-name:var(--font-heading)] truncate" style={{ textTransform: "none" }}>
              {match.away_team}
            </span>
          </div>
        </div>
        {match.time && match.status === "scheduled" && (
          <p className="mt-1 text-[9px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide">
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
          <span
            className="w-11 h-11 rounded-full border-2 border-ink flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 font-[family-name:var(--font-heading)]"
            style={{ background: colors.home, boxShadow: "2px 2px 0 var(--color-ink)" }}
          >
            {initials.home}
          </span>
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
          <span
            className="w-11 h-11 rounded-full border-2 border-ink flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 font-[family-name:var(--font-heading)]"
            style={{ background: colors.away, boxShadow: "2px 2px 0 var(--color-ink)" }}
          >
            {initials.away}
          </span>
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