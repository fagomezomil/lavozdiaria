/** Placas de agenda para stories IG/FB (1080×1920) — estilo EventModal de /agenda.
 *
 *  4 placas: 3 de evento (1 cultural / 1 deportivo / 1 turístico, con fallback
 *  a culturales y luego a eventos de días siguientes) + 1 listado del día (8 filas,
 *  completado con eventos de días siguientes marcados con separador "MAÑANA — ...").
 *
 *  Diseño aprobado por Fede (2026-09-12, mockups scripts/test-agenda-mockups.tsx):
 *  - EventCard: hero full-bleed 1400 + gradiente + body paper (min 520, crece
 *    desde abajo, padding bottom 40), date pill, chips cat/hora/precio, datos clave
 *    cream con borde ink, CTA rosa con hard shadow.
 *  - Listado: header ink 340 (AGENDA rosa + TUCUMANA blanco) + lista paper 1240
 *    + footer ink 340 (frase itálica + logo blanco 140).
 */

import { render } from "takumi-js";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFonts } from "./fonts";
import { INK, HALFTONE_WHITE_SOFT, STORY_W, STORY_H } from "./slide-template-v2";

// Tokens de agenda (globals.css)
const PAPER = "#fdfbf7";
const CREAM = "#f5efe4";
const MUTED = "#6b6257";
const AGENDA = "#db2777";
const DEEP = "#be185d";

const CAT_COLOR: Record<string, string> = {
  cultural: "#db2777",
  turistico: "#0891b2",
  deportivo: "#65a30d",
};
const CAT_LABEL: Record<string, string> = {
  cultural: "Cultural",
  turistico: "Turístico",
  deportivo: "Deportivo",
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_WHITE_PATH = join(__dirname, "..", "..", "..", "public", "logo", "logo-white.png");

/** Evento crudo de la tabla events (subset usado por las placas). */
export interface AgendaEventSrc {
  id: string;
  title: string;
  category: string;
  date_iso: string | null;
  end_date: string | null;
  time: string | null;
  venue_name: string | null;
  venue_city: string | null;
  image_url: string | null;
  description: string | null;
  excerpt: string | null;
  price_range: string | null;
  price_min: number | null;
  price_max: number | null;
  is_free: boolean;
}

export interface ListadoRow {
  time: string;
  title: string;
  venue: string;
  cat: string;
  dayLabel?: string;
}

export interface AgendaSeleccion {
  eventoPlacas: AgendaEventSrc[];
  listado: ListadoRow[];
  hoyIso: string;
  fechaHeader: string; // "sábado 12 de septiembre · Tucumán"
  fechaDia: string; // "Sábado"
  fechaNum: string; // "12"
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Hoy en Argentina (UTC-3, sin DST) como YYYY-MM-DD. */
export function hoyArtIso(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function isoToDate(iso: string): Date {
  // T12:00Z evita off-by-one por zonas horarias al usar getUTCDate/getUTCDay.
  return new Date(`${iso}T12:00:00Z`);
}

function diaNombre(iso: string): string {
  const d = isoToDate(iso);
  return DIAS_SEMANA[d.getUTCDay()];
}

function diaNumero(iso: string): string {
  return String(isoToDate(iso).getUTCDate());
}

/** Normaliza time de DB ("21:00", "21:00:00", "21.00hs") → "21:00", o null. */
function horaCorta(time: string | null): string | null {
  if (!time) return null;
  const m = time.match(/^(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

/** Quita el sufijo sucio del scraper mercedes_sosa: " – 12/09/2026 – 21.00hs – ST". */
export function limpiarTitulo(t: string): string {
  return t.replace(/\s*[–-]\s*\d{2}\/\d{2}\/\d{4}.*$/, "").trim();
}

/** Clave de dedupe: título limpio, sin acentos, solo [a-z0-9]. */
export function normalizarTitulo(t: string): string {
  return limpiarTitulo(t)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Corte automático de descripción a N palabras. */
function cortarPalabras(texto: string, max: number): string {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (palabras.length <= max) return texto;
  return palabras.slice(0, max).join(" ") + "...";
}

function isFreeEvent(e: AgendaEventSrc): boolean {
  return e.is_free || (e.price_min === 0 && e.price_max === 0);
}

function priceLabel(e: AgendaEventSrc): string | null {
  if (isFreeEvent(e)) return null;
  return e.price_range || null;
}

/** Etiqueta de día para el separador: +1 día → "Mañana — Domingo 13", sino "Domingo 13". */
function labelDiaFuturo(iso: string, hoyIso: string): string {
  const diffDays = Math.round(
    (isoToDate(iso).getTime() - isoToDate(hoyIso).getTime()) / 86400000,
  );
  const base = `${diaNombre(iso)} ${diaNumero(iso)}`;
  return diffDays === 1 ? `Mañana — ${base}` : base;
}

/**
 * Selecciona el contenido de las 4 placas.
 *
 * Placas de evento (orden cultural → deportivo → turístico):
 *   1. Primer evento de hoy de ese tipo (por hora), no usado.
 *   2. Si no hay → primer cultural de hoy no usado.
 *   3. Si no hay → primer evento futuro no usado (cualquier tipo).
 *   4. Si no hay → esa placa no sale (el listado puede seguir).
 *
 * Listado (8): eventos de hoy ordenados por hora; si hay menos de 8 se completa
 *   con eventos futuros (cercanos primero), agrupados con dayLabel por fecha.
 *
 * `minHour` (run de la tarde): solo eventos con time >= "HH:00" participan de hoy.
 * `excluirIds` (dedupe de la tarde): eventos ya destacados al mediodía — quedan fuera
 *   de las PLACAS destacadas pero siguen apareciendo en el listado.
 * `eventosHoy` deben venir ya filtrados "suceden hoy" (date_iso = hoy OR rango activo).
 * `eventosFuturos` ordenados por (date_iso, time) ascendente.
 */
export function seleccionarContenido(
  eventosHoy: AgendaEventSrc[],
  eventosFuturos: AgendaEventSrc[],
  minHour: number | null,
  excluirIds?: Set<string>,
  excluirTitulosSet?: Set<string>,
): AgendaSeleccion {
  const hoyIso = hoyArtIso();
  const minStr =
    minHour != null ? `${String(minHour).padStart(2, "0")}:00` : null;

  let poolHoy = eventosHoy.filter((e) => horaCorta(e.time) !== null);
  if (minStr) {
    poolHoy = poolHoy.filter((e) => (horaCorta(e.time) ?? "") >= minStr);
  }
  poolHoy.sort((a, b) => (horaCorta(a.time) ?? "").localeCompare(horaCorta(b.time) ?? ""));
  // Sin hora (solo run del mediodía): van al final del listado del día.
  const sinHora = minStr == null ? eventosHoy.filter((e) => horaCorta(e.time) === null) : [];

  // Dedupe por título normalizado: el mismo evento llega duplicado desde fuentes
  // distintas (p.ej. entradanet + mercedes_sosa con títulos invertidos u horas
  // distintas). Keep first = el de menor hora. Aplica a placas Y listado.
  const titulosVistos = new Set<string>();
  const dedupePorTitulo = (list: AgendaEventSrc[]): AgendaEventSrc[] => {
    const out: AgendaEventSrc[] = [];
    for (const e of list) {
      const key = normalizarTitulo(e.title);
      if (key && titulosVistos.has(key)) continue;
      if (key) titulosVistos.add(key);
      out.push(e);
    }
    return out;
  };
  const poolHoyDedup = dedupePorTitulo(poolHoy);
  const sinHoraDedup = dedupePorTitulo(sinHora);

  const usados = new Set<string>(excluirIds ?? []);
  const excluirTitulos = excluirTitulosSet ?? new Set<string>();
  const placaEligible = (e: AgendaEventSrc): boolean =>
    !usados.has(e.id) && !excluirTitulos.has(normalizarTitulo(e.title));
  const eventoPlacas: AgendaEventSrc[] = [];
  for (const tipo of ["cultural", "deportivo", "turistico"]) {
    const candidato =
      poolHoyDedup.find((e) => e.category === tipo && placaEligible(e)) ??
      poolHoyDedup.find((e) => e.category === "cultural" && placaEligible(e)) ??
      eventosFuturos.find((e) => placaEligible(e));
    if (candidato) {
      usados.add(candidato.id);
      eventoPlacas.push(candidato);
    }
  }

  const toRow = (e: AgendaEventSrc, dayLabel?: string): ListadoRow => {
    const venueLimpio = e.venue_name || e.venue_city || "Tucumán";
    const city =
      e.venue_name && e.venue_city && e.venue_city !== e.venue_name ? ` · ${e.venue_city}` : "";
    return {
      time: horaCorta(e.time) ?? "—",
      title: limpiarTitulo(e.title),
      venue: `${venueLimpio}${city}`,
      cat: e.category,
      dayLabel,
    };
  };

  const eventosListado = [...poolHoyDedup, ...sinHoraDedup];
  const listado: ListadoRow[] = eventosListado.map((e) => toRow(e));
  if (listado.length < 8) {
    for (const e of eventosFuturos) {
      if (listado.length >= 8) break;
      if (e.date_iso && !titulosVistos.has(normalizarTitulo(e.title))) {
        listado.push(toRow(e, labelDiaFuturo(e.date_iso, hoyIso)));
      }
    }
  }

  const mes = MESES[isoToDate(hoyIso).getUTCMonth()];
  const fechaHeader = `${diaNombre(hoyIso).toLowerCase()} ${diaNumero(hoyIso)} de ${mes} · Tucumán`;

  return {
    eventoPlacas,
    listado,
    hoyIso,
    fechaHeader,
    fechaDia: diaNombre(hoyIso),
    fechaNum: diaNumero(hoyIso),
  };
}

// ===================== Render (mockup aprobado) =====================

let logoWhiteCache: string | null = null;
async function loadLogoWhite(): Promise<string> {
  if (logoWhiteCache) return logoWhiteCache;
  try {
    const buf = await readFile(LOGO_WHITE_PATH);
    logoWhiteCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("agenda-placas loadLogoWhite error:", err);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><text x="0" y="36" font-family="Oswald,Arial,sans-serif" font-weight="700" font-size="34" fill="#ffffff">¡QUE NOTICIA!</text></svg>`;
    logoWhiteCache = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return logoWhiteCache;
}

/** Descarga la imagen del evento y la normaliza a PNG data URL (takumi no
 *  soporta WebP y formatos raros). Null si falla → la placa usa el bg del color
 *  de categoría. */
async function fetchImageAsDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = Buffer.from(await res.arrayBuffer());
    const png = await sharp(raw).flatten({ background: "#ffffff" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (err) {
    console.warn(`agenda-placas imagen falló (${url}):`, String(err).slice(0, 120));
    return null;
  }
}

interface EventoPlaca {
  title: string;
  time: string;
  venue: string;
  city: string;
  price: string | null;
  isFree: boolean;
  desc: string | null;
  cat: string;
}

function catColor(cat: string): string {
  return CAT_COLOR[cat] ?? CAT_COLOR.cultural;
}

/** Fondo story: ink + halftone + barra rosa agenda (como el backdrop del modal). */
function Fondo({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: STORY_W,
        height: STORY_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: STORY_W,
          height: STORY_H,
          backgroundImage: HALFTONE_WHITE_SOFT,
          backgroundSize: "12px 12px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: STORY_W,
          height: 14,
          backgroundColor: AGENDA,
        }}
      />
      {children}
    </div>
  );
}

function DatePill({ num, dia }: { num: string; dia: string }): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 44,
        backgroundColor: PAPER,
        boxShadow: "0 0 0 3px " + INK,
        padding: "12px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 44,
          color: DEEP,
          lineHeight: 1,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          color: INK,
          marginTop: 4,
        }}
      >
        {dia}
      </div>
    </div>
  );
}

/** Chip de precio o Gratis (isFree → bg deportivo, como el modal). */
function PriceChip({ price, isFree }: { price: string | null; isFree: boolean }) {
  if (isFree) {
    return (
      <div
        style={{
          backgroundColor: CAT_COLOR.deportivo,
          color: "#ffffff",
          boxShadow: "0 0 0 3px " + CAT_COLOR.deportivo,
          padding: "8px 16px",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          fontFamily: "Oswald",
        }}
      >
        Gratis
      </div>
    );
  }
  if (!price) return <div style={{ display: "none" }} />;
  return (
    <div
      style={{
        backgroundColor: PAPER,
        boxShadow: "0 0 0 3px " + INK,
        padding: "8px 16px",
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2.4,
        textTransform: "uppercase",
        fontFamily: "Oswald",
        color: INK,
      }}
    >
      {price}
    </div>
  );
}

/** Placa de evento: hero imagen full-bleed 1400px + body paper 520px (elástico
 *  hacia arriba con el contenido, gradiente siempre entre imagen y body). */
function EventCard({
  ev,
  imageDataUrl,
  fechaNum,
  fechaDia,
}: {
  ev: EventoPlaca;
  imageDataUrl: string | null;
  fechaNum: string;
  fechaDia: string;
}): React.ReactElement {
  const color = catColor(ev.cat);
  return (
    <div
      style={{
        width: STORY_W,
        height: STORY_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
        display: "flex",
      }}
    >
      {/* Hero imagen full-bleed */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 1400,
          backgroundColor: color,
          display: "flex",
        }}
      >
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1400, objectFit: "cover" }}
          />
        )}
      </div>

      {/* Barra rosa agenda sobre la imagen */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 14,
          backgroundColor: AGENDA,
        }}
      />

      <DatePill num={fechaNum} dia={fechaDia} />

      {/* Gradiente + body anclados abajo: el gradiente queda siempre sobre la
          imagen y encima del body; se mueven juntos si el body crece. */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 1080,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 1080,
            height: 160,
            background: "linear-gradient(to top, rgba(253,251,247,1), rgba(253,251,247,0))",
          }}
        />
        <div
          style={{
            width: 1080,
            minHeight: 520,
            backgroundColor: PAPER,
            padding: "30px 48px 40px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Chips */}
          <div style={{ display: "flex", flexDirection: "row", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <div
              style={{
                backgroundColor: color,
                color: "#ffffff",
                padding: "7px 16px",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                fontFamily: "Oswald",
              }}
            >
              {CAT_LABEL[ev.cat] ?? CAT_LABEL.cultural}
            </div>
            <div
              style={{
                backgroundColor: PAPER,
                boxShadow: "0 0 0 3px " + INK,
                padding: "7px 16px",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                fontFamily: "Oswald",
                color: INK,
              }}
            >
              {ev.time} hs
            </div>
            <PriceChip price={ev.price} isFree={ev.isFree} />
          </div>

          {/* Título */}
          <div
            style={{
              fontFamily: "Oswald",
              fontWeight: 700,
              fontSize: 54,
              lineHeight: 1.08,
              color: INK,
              marginBottom: 18,
            }}
          >
            {ev.title}
          </div>

          {/* Descripción */}
          {ev.desc && (
            <div
              style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: 25,
                lineHeight: 1.45,
                color: "rgba(10,10,10,.85)",
                marginBottom: 14,
              }}
            >
              {ev.desc}
            </div>
          )}

          {/* Datos clave */}
          <div
            style={{
              boxShadow: "0 0 0 3px " + INK,
              backgroundColor: CREAM,
              padding: "22px 28px",
              marginTop: 20,
              marginBottom: 20,
              display: "flex",
              flexDirection: "row",
              gap: 32,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", width: 340 }}>
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: 2.2,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: MUTED,
                  fontFamily: "Oswald",
                  marginBottom: 5,
                }}
              >
                Fecha y hora
              </div>
              <div style={{ fontSize: 31, fontWeight: 600, fontFamily: "Oswald", color: INK }}>
                {fechaDia} {fechaNum} · {ev.time} hs
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: 2.2,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: MUTED,
                  fontFamily: "Oswald",
                  marginBottom: 5,
                }}
              >
                Lugar
              </div>
              <div
                style={{
                  fontSize: 31,
                  fontWeight: 600,
                  fontFamily: "Oswald",
                  color: INK,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {ev.venue}
              </div>
              <div style={{ fontSize: 26, color: MUTED, marginTop: 0 }}>{ev.city}</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div
              style={{
                backgroundColor: AGENDA,
                color: "#ffffff",
                boxShadow: "6px 6px 0 " + INK,
                padding: "16px 30px",
                fontFamily: "Oswald",
                fontWeight: 600,
                fontSize: 24,
                letterSpacing: 2.4,
                textTransform: "uppercase",
              }}
            >
              Más en agenda {">"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Placa listado del día: header ink 340 + lista paper 1240 + footer ink 340. */
function Listado({
  rows,
  fechaHeader,
  logoWhiteDataUrl,
}: {
  rows: ListadoRow[];
  fechaHeader: string;
  logoWhiteDataUrl: string;
}): React.ReactElement {
  type Row =
    | { kind: "ev"; time: string; title: string; venue: string; cat: string }
    | { kind: "sep"; label: string };
  const flat: Row[] = [];
  rows.forEach((e, i) => {
    if (e.dayLabel && (i === 0 || rows[i - 1].dayLabel !== e.dayLabel)) {
      flat.push({ kind: "sep", label: e.dayLabel });
    }
    flat.push({ kind: "ev", time: e.time, title: e.title, venue: e.venue, cat: e.cat });
  });
  return (
    <Fondo>
      {/* Header ink — fijo 340px, contenido centrado vertical */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 48,
          width: 984,
          height: 326,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: 92,
            lineHeight: 1.05,
          }}
        >
          <div style={{ color: AGENDA }}>AGENDA</div>
          <div style={{ color: "#ffffff" }}>TUCUMANA</div>
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 34,
            color: "#c9c2b4",
            marginTop: 16,
            textTransform: "capitalize",
          }}
        >
          {fechaHeader}
        </div>
      </div>

      {/* Lista paper full-bleed — body fijo 1240px */}
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 0,
          width: 1080,
          height: 1240,
          backgroundColor: PAPER,
          padding: "30px 48px 36px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {flat.map((row, idx) =>
          row.kind === "sep" ? (
            <div
              key={`sep-${idx}`}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: idx < flat.length - 1 ? "1px solid rgba(10,10,10,.14)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "Oswald",
                  fontWeight: 600,
                  fontSize: 26,
                  color: MUTED,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                }}
              >
                {row.label}
              </div>
            </div>
          ) : (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 18,
                padding: "18px 0",
                borderBottom: idx < flat.length - 1 ? "1px solid rgba(10,10,10,.14)" : "none",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: catColor(row.cat),
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "Oswald",
                  fontWeight: 700,
                  fontSize: 38,
                  color: DEEP,
                  width: 130,
                  flexShrink: 0,
                }}
              >
                {row.time}
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: 780 }}>
                <div
                  style={{
                    fontFamily: "Oswald",
                    fontWeight: 600,
                    fontSize: 37,
                    color: INK,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {row.title}
                </div>
                <div
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: 28,
                    color: MUTED,
                  }}
                >
                  {row.venue}
                </div>
              </div>
            </div>
          ),
        )}
        <div style={{ display: "flex", flexDirection: "row", marginTop: 26 }}>
          <div
            style={{
              backgroundColor: AGENDA,
              color: "#ffffff",
              boxShadow: "6px 6px 0 " + INK,
              padding: "16px 30px",
              fontFamily: "Oswald",
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: 2.4,
              textTransform: "uppercase",
            }}
          >
            Agenda completa {">"}
          </div>
        </div>
      </div>

      {/* Footer ink: frase itálica + logo blanco */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 1080,
          height: 340,
          backgroundColor: INK,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 40,
          gap: 40,
        }}
      >
        <div
          style={{
            fontStyle: "italic",
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 52,
            color: "#ffffff",
            marginLeft: 30,
            marginRight: 30,
          }}
        >
          ¿Ya tenés planes para hoy?
        </div>
        <img src={logoWhiteDataUrl} style={{ height: 140 }} />
      </div>
    </Fondo>
  );
}

export interface AgendaPlacaPng {
  slug: string;
  png: Buffer;
}

/** Renderiza las placas seleccionadas: N placas de evento (1 por categoría con
 *  fallback) + 1 listado. Devuelve buffers PNG listos para subir a R2. */
export async function generarPlacasPng(sel: AgendaSeleccion): Promise<AgendaPlacaPng[]> {
  const fonts = await loadFonts();
  const logoWhite = await loadLogoWhite();

  const placas: AgendaPlacaPng[] = [];

  for (let i = 0; i < sel.eventoPlacas.length; i++) {
    const e = sel.eventoPlacas[i];
    const imageDataUrl = await fetchImageAsDataUrl(e.image_url);
    const evPlaca: EventoPlaca = {
      title: limpiarTitulo(e.title),
      time: horaCorta(e.time) ?? "",
      venue: e.venue_name ?? "Tucumán",
      city: e.venue_city ?? "",
      price: priceLabel(e),
      isFree: isFreeEvent(e),
      desc: e.description || e.excerpt
        ? cortarPalabras((e.description || e.excerpt) as string, 40)
        : null,
      cat: e.category,
    };
    const el = (
      <EventCard ev={evPlaca} imageDataUrl={imageDataUrl} fechaNum={sel.fechaNum} fechaDia={sel.fechaDia} />
    );
    const png = await render(el, { width: STORY_W, height: STORY_H, fonts });
    placas.push({ slug: `evento-${i + 1}-${e.category}`, png: Buffer.from(png) });
  }

  const elListado = (
    <Listado rows={sel.listado} fechaHeader={sel.fechaHeader} logoWhiteDataUrl={logoWhite} />
  );
  const pngListado = await render(elListado, { width: STORY_W, height: STORY_H, fonts });
  placas.push({ slug: "listado", png: Buffer.from(pngListado) });

  return placas;
}