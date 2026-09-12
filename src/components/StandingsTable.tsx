import Link from "next/link";
import type { StandingRow } from "@/lib/sports";
import { teamLogo } from "@/lib/team-logos";

interface StandingsTableProps {
  rows: StandingRow[];
  /** Mostrar solo top N */
  limit?: number;
  /** full: todas las columnas, compact: # · Equipo · PJ · DG · Pts */
  variant?: "full" | "compact";
  /** Mostrar link "Ver todos →" al pie (linkea a /deportes/futbol) */
  showViewAll?: boolean;
  /** Título opcional para el header (compact). Default: "Tabla" */
  title?: string;
}

export default function StandingsTable({
  rows,
  limit,
  variant = "full",
  showViewAll = false,
  title,
}: StandingsTableProps) {
  const shown = limit ? rows.slice(0, limit) : rows;

  if (shown.length === 0) {
    return (
      <div className="border-2 border-ink bg-paper p-6 text-center">
        <p className="text-xs text-muted font-[family-name:var(--font-heading)] uppercase tracking-wide">
          Sin partidos jugados para calcular la tabla
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="border-t-2 border-ink">
        {/* Header compacto */}
        <div className="bg-cream px-3 py-2 flex items-center justify-between border-b-2 border-ink">
          <h3
            className="text-[14px] uppercase tracking-[0.14em] font-bold text-ink font-[family-name:var(--font-heading)]"
            style={{ textTransform: "none" }}
          >
            {title ?? "Tabla"}
          </h3>
          <span className="text-[12px] uppercase tracking-[0.12em] text-muted font-[family-name:var(--font-heading)]">
            {rows.length} equipos
          </span>
        </div>
        {/* Tabla compacta */}
        <table className="w-full border-collapse font-[family-name:var(--font-heading)]">
          <thead>
            <tr className="text-[12px] uppercase tracking-[0.1em] text-muted border-b border-ink/15">
              <th className="px-1.5 py-1 text-center w-6">#</th>
              <th className="px-1.5 py-1 text-left">Equipo</th>
              <th className="px-1.5 py-1 text-center w-7" title="Jugados">PJ</th>
              <th className="px-1.5 py-1 text-center w-8" title="Diferencia de gol">DG</th>
              <th className="px-2 py-1 text-center w-8" title="Puntos">Pts</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => {
              const pos = i + 1;
              return (
                <tr
                  key={r.team}
                  className={`border-b border-ink/5 last:border-b-0 ${
                    pos <= 4 ? "bg-brand/5" : ""
                  }`}
                >
                  <td className="px-1.5 py-1.5 text-center text-[13px] font-bold text-ink/70">
                    {pos}
                  </td>
                  <td className="px-1.5 py-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {teamLogo(r.team) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={teamLogo(r.team)!}
                          alt={r.team}
                          width={30}
                          height={30}
                          loading="lazy"
                          className="w-[30px] h-[30px] object-contain flex-shrink-0"
                        />
                      ) : (
                        r.color &&
                        r.initials && (
                          <span
                            className="w-[30px] h-[30px] rounded-full border border-ink flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background: r.color }}
                          >
                            {r.initials}
                          </span>
                        )
                      )}
                      <span
                        className="text-[13px] font-semibold text-ink truncate"
                        style={{ textTransform: "none" }}
                      >
                        {r.team}
                      </span>
                    </div>
                  </td>
                  <td className="px-1.5 py-1.5 text-center text-[13px] text-ink/70">{r.pj}</td>
                  <td className="px-1.5 py-1.5 text-center text-[13px] font-semibold text-ink/80">
                    {r.dg > 0 ? `+${r.dg}` : r.dg}
                  </td>
                  <td className="px-2 py-1.5 text-center text-[14px] font-bold text-ink">{r.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {showViewAll && (
          <Link
            href="/deportes/futbol"
            className="block bg-ink text-paper text-[10px] uppercase tracking-[0.14em] font-bold text-center py-2 hover:bg-brand hover:text-ink transition-colors font-[family-name:var(--font-heading)]"
          >
            Ver todos →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className="border-2 border-ink bg-paper shadow-hard-lg overflow-hidden"
      style={{ boxShadow: "8px 8px 0 var(--color-ink)" }}
    >
      {/* Header negro */}
      <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-70 font-[family-name:var(--font-heading)]">
            Liga Profesional 2026
          </p>
          <h2
            className="text-xl font-bold font-[family-name:var(--font-heading)] leading-none tracking-tight"
            style={{ textTransform: "none" }}
          >
            Tabla de posiciones
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] opacity-60 font-[family-name:var(--font-heading)]">
          {rows.length} equipos
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-[family-name:var(--font-heading)]">
          <thead>
            <tr className="bg-cream border-b-2 border-ink text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-2 text-center w-8">#</th>
              <th className="px-2 py-2 text-left">Equipo</th>
              <th className="px-2 py-2 text-center w-10" title="Partidos jugados">PJ</th>
              <th className="px-2 py-2 text-center w-10" title="Ganados">PG</th>
              <th className="px-2 py-2 text-center w-10" title="Empatados">PE</th>
              <th className="px-2 py-2 text-center w-10" title="Perdidos">PP</th>
              <th className="px-2 py-2 text-center w-10" title="Goles a favor">GF</th>
              <th className="px-2 py-2 text-center w-10" title="Goles en contra">GC</th>
              <th className="px-2 py-2 text-center w-10" title="Diferencia de gol">DG</th>
              <th className="px-3 py-2 text-center w-12 bg-brand/10 text-ink font-bold" title="Puntos">Pts</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => {
              const pos = i + 1;
              const isTop = pos <= 4;
              const isMid = pos >= 5 && pos <= 8;
              return (
                <tr
                  key={r.team}
                  className={`border-b border-ink/10 last:border-b-0 ${
                    isTop ? "bg-brand/5" : isMid ? "bg-cream/50" : ""
                  }`}
                >
                  <td className="px-2 py-2 text-center text-[12px] font-bold text-ink">{pos}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.color && r.initials && (
                        <span
                          className="w-6 h-6 rounded-full border border-ink flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                          style={{ background: r.color }}
                        >
                          {r.initials}
                        </span>
                      )}
                      <span
                        className="text-[13px] font-semibold text-ink truncate"
                        style={{ textTransform: "none" }}
                      >
                        {r.team}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-[12px] text-ink/80">{r.pj}</td>
                  <td className="px-2 py-2 text-center text-[12px] text-ink/80">{r.pg}</td>
                  <td className="px-2 py-2 text-center text-[12px] text-ink/80">{r.pe}</td>
                  <td className="px-2 py-2 text-center text-[12px] text-ink/80">{r.pp}</td>
                  <td className="px-2 py-2 text-center text-[12px] text-ink/80">{r.gf}</td>
                  <td className="px-2 py-2 text-center text-[12px] text-ink/80">{r.gc}</td>
                  <td className="px-2 py-2 text-center text-[12px] font-semibold text-ink">
                    {r.dg > 0 ? `+${r.dg}` : r.dg}
                  </td>
                  <td className="px-3 py-2 text-center text-[14px] font-bold text-ink bg-brand/10">
                    {r.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer leyenda */}
      <div className="border-t-2 border-ink bg-cream px-4 py-2 flex flex-wrap gap-3 text-[9px] uppercase tracking-[0.12em] font-[family-name:var(--font-heading)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-brand/30 border border-ink/30" />
          <span className="text-muted">Libertadores (1-4)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-cream/80 border border-ink/30" />
          <span className="text-muted">Sudamericana (5-8)</span>
        </span>
      </div>
    </div>
  );
}