"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  SectionCount,
  SourceCount,
  SourceBreakdown,
  StatsTotals,
} from "@/lib/stats";

const BRAND = "#f97316";
const INK = "#0a0a0a";
const SECTION_COLORS: Record<string, string> = {
  politica: "#e63946",
  deportes: "#3b82f6",
  economia: "#10b981",
  internacionales: "#8b5cf6",
  tucuman: "#f59e0b",
  opinion: "#0d9488",
};
const SOURCE_COLORS: Record<string, string> = {
  Contexto: "#f97316",
  Comunicación: "#0a0a0a",
  "Comunicación SMT": "#84cc16",
  "TyC Sports": "#3b82f6",
  Ámbito: "#06b6d4",
  Replicadas: "#6b7280",
  TN: "#dc2626",
  Clarín: "#7c3aed",
  "La Nación": "#0ea5e9",
  Infobae: "#16a34a",
  Télam: "#facc15",
  "El Liberal": "#ec4899",
  "Los Primeros": "#14b8a6",
  "Página/12": "#f43f5e",
  "La Gaceta": "#a3a3a3",
  Otros: "#d4d4d4",
};

type Period = "day" | "week" | "month";

interface Props {
  totals: StatsTotals;
  bySection: SectionCount[];
  bySource: SourceBreakdown;
  timestamps: string[];
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-4 border-2 border-ink bg-white shadow-[4px_4px_0_var(--color-ink)]`}
    >
      <div className="text-[10px] tracking-[0.3em] uppercase font-[family-name:var(--font-heading)] text-ink/60">
        {label}
      </div>
      <div
        className={`mt-1 text-3xl font-[family-name:var(--font-heading)] font-bold ${
          accent ? "text-brand" : "text-ink"
        }`}
      >
        {value.toLocaleString("es-AR")}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-4 border-2 border-ink bg-white shadow-[4px_4px_0_var(--color-ink)]">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-sm font-[family-name:var(--font-heading)] uppercase tracking-[0.2em] text-ink">
          {title}
        </h2>
        {action}
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: INK,
  border: `2px solid ${BRAND}`,
  color: "#fff",
  fontFamily: "var(--font-heading)",
  fontSize: 12,
  padding: "6px 10px",
};

/** ISO week number — Monday-based, per ISO 8601. */
function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-S${String(weekNo).padStart(2, "0")}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function aggregate(
  timestamps: string[],
  period: Period,
): { label: string; count: number }[] {
  const buckets: Record<string, number> = {};
  const now = new Date();
  let cutoff = new Date(0);
  let bucketCount = 0;
  if (period === "day") {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    bucketCount = 30;
  } else if (period === "week") {
    cutoff = new Date(startOfWeek(now).getTime() - 11 * 7 * 86400000);
    bucketCount = 12;
  } else {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    bucketCount = 12;
  }

  for (const ts of timestamps) {
    const d = new Date(ts);
    if (d < cutoff) continue;
    let key: string;
    if (period === "day") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else if (period === "week") {
      key = isoWeek(d);
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    buckets[key] = (buckets[key] || 0) + 1;
  }

  const result: { label: string; count: number }[] = [];
  if (period === "day") {
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const short = `${d.getDate()}/${d.getMonth() + 1}`;
      result.push({ label: short, count: buckets[key] ?? 0 });
    }
  } else if (period === "week") {
    for (let i = bucketCount - 1; i >= 0; i--) {
      const start = new Date(startOfWeek(now).getTime() - i * 7 * 86400000);
      const key = isoWeek(start);
      const end = new Date(start.getTime() + 6 * 86400000);
      const short = `${start.getDate()}/${start.getMonth() + 1}-${end.getDate()}/${end.getMonth() + 1}`;
      result.push({ label: short, count: buckets[key] ?? 0 });
    }
  } else {
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const short = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
      result.push({ label: short, count: buckets[key] ?? 0 });
    }
  }
  return result;
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const options: { id: Period; label: string }[] = [
    { id: "day", label: "Día" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mes" },
  ];
  return (
    <div className="inline-flex border-2 border-ink overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1 text-xs font-[family-name:var(--font-heading)] uppercase tracking-[0.15em] transition-colors ${
            value === opt.id
              ? "bg-brand text-white"
              : "bg-white text-ink hover:bg-ink/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function StatsDashboard({
  totals,
  bySection,
  bySource,
  timestamps,
}: Props) {
  const [period, setPeriod] = useState<Period>("month");
  const [sourceView, setSourceView] = useState<"agg" | "det">("agg");
  const series = useMemo(() => aggregate(timestamps, period), [timestamps, period]);
  const periodLabel =
    period === "day"
      ? "últimos 30 días"
      : period === "week"
        ? "últimas 12 semanas"
        : "últimos 12 meses";
  const sourceData =
    sourceView === "agg" ? bySource.aggregated : bySource.detailed;
  const sourceTitle =
    sourceView === "agg"
      ? "Notas por fuente"
      : "Notas por fuente (replicadas desagregadas)";

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-[family-name:var(--font-heading)] uppercase tracking-[0.1em] text-ink">
          Estadísticas
        </h1>
        <span className="text-xs text-ink/50 uppercase tracking-[0.2em] font-[family-name:var(--font-heading)]">
          Panel general
        </span>
      </header>

      {/* Tarjetas totales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Notas" value={totals.articles} accent />
        <StatCard label="Comentarios" value={totals.comments} />
        <StatCard label="Avisos" value={totals.ads} />
        <StatCard label="Patrocinados" value={totals.sponsored} />
        <StatCard label="Clientes" value={totals.clients} />
        <StatCard label="Usuarios" value={totals.users} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notas por sección — barras */}
        <ChartCard title="Notas por sección">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySection} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0001" />
              <XAxis
                dataKey="section"
                tick={{ fill: INK, fontFamily: "var(--font-heading)", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: INK, fontFamily: "var(--font-heading)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: `${BRAND}22` }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {bySection.map((entry) => (
                  <Cell
                    key={entry.section}
                    fill={SECTION_COLORS[entry.section] ?? BRAND}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Notas por fuente — donut con toggle Agregado/Detallado */}
        <ChartCard
          title={sourceTitle}
          action={
            <div className="inline-flex border-2 border-ink overflow-hidden">
              <button
                onClick={() => setSourceView("agg")}
                className={`px-3 py-1 text-xs font-[family-name:var(--font-heading)] uppercase tracking-[0.15em] transition-colors ${
                  sourceView === "agg"
                    ? "bg-brand text-white"
                    : "bg-white text-ink hover:bg-ink/5"
                }`}
              >
                Agregado
              </button>
              <button
                onClick={() => setSourceView("det")}
                className={`px-3 py-1 text-xs font-[family-name:var(--font-heading)] uppercase tracking-[0.15em] transition-colors ${
                  sourceView === "det"
                    ? "bg-brand text-white"
                    : "bg-white text-ink hover:bg-ink/5"
                }`}
              >
                Detallado
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                dataKey="count"
                nameKey="source"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                stroke={INK}
                strokeWidth={2}
              >
                {sourceData.map((entry) => (
                  <Cell
                    key={entry.source}
                    fill={SOURCE_COLORS[entry.source] ?? "#999"}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ fontFamily: "var(--font-heading)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Evolución temporal — full width con filtro */}
      <ChartCard
        title={`Notas por ${period === "day" ? "día" : period === "week" ? "semana" : "mes"} (${periodLabel})`}
        action={<PeriodToggle value={period} onChange={setPeriod} />}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0001" />
            <XAxis
              dataKey="label"
              tick={{ fill: INK, fontFamily: "var(--font-heading)", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: INK, fontFamily: "var(--font-heading)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="count"
              stroke={BRAND}
              strokeWidth={3}
              dot={{ fill: INK, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: BRAND, stroke: INK }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}