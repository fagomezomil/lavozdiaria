/** Placas de resultados de partidos (roadmap ítem 5) — story 1080×1920 + feed 1080×1350.
 *
 *  Diseño: Opción A "Scoreboard" elegida por Fede (2026-09-12, editor-visual.html)
 *  con sus modificaciones horneadas: CTA grande (394×93, fs 32) y logo blanco
 *  grande (342×197) anclados en el footer, en vez del footer centrado original.
 *
 *  Entrada: filas de sports_matches con score (status played) + URLs de escudos
 *  (R2 escudos/{slug}.png) o data URLs. Genera PNGs takumi listos para Buffer.
 */

import { render } from "takumi-js";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFonts } from "./fonts";
import { INK, HALFTONE_WHITE_SOFT, STORY_W, STORY_H } from "./slide-template-v2";

// Tokens de diseño (globals.css)
const PAPER = "#fdfbf7";
const CREAM = "#f5efe4";
const MUTED = "#6b6257";
const BRAND = "#f97316";
const GRIS = "#c9c2b4";

export const FEED_W = 1080;
export const FEED_H = 1350;

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_WHITE_PATH = join(__dirname, "..", "..", "..", "public", "logo", "logo-white.png");

/** Partido jugado, subset de sports_matches usado por las placas. */
export interface PartidoPlacaSrc {
  /** Clave de dedupe/publicación (ej: match_id de matchesio). */
  slug: string;
  torneo: string;
  /** Fecha display corta, ej: "Dom 06 Sep". */
  fecha: string;
  hora: string;
  estadio: string;
  ciudad: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  /** URL http(s) (R2) o data URL del escudo. */
  escudoHomeUrl: string;
  escudoAwayUrl: string;
}

export interface PartidoPlacaPng {
  slug: string;
  png: Buffer;
}

// ===================== Helpers =====================

let logoWhiteCache: string | null = null;

/** Logo blanco de la marca como data URL (fallback SVG si falta el archivo). */
export async function loadLogoWhite(): Promise<string> {
  if (logoWhiteCache) return logoWhiteCache;
  try {
    const buf = await readFile(LOGO_WHITE_PATH);
    logoWhiteCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoWhiteCache =
      "data:image/svg+xml," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="342" height="197"><rect width="342" height="197" fill="#f97316"/><text x="171" y="118" font-family="sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle">¡QN!</text></svg>'
      );
  }
  return logoWhiteCache;
}

/** Escudo a data URL. data: pasa directo; http(s) se baja y aplana sobre blanco. */
async function fetchEscudoDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`escudo ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const png = await sharp(buf).flatten({ background: "#ffffff" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

// ===================== Piezas compartidas =====================

function ResultadoHeader({
  torneo,
  fecha,
  titleSize,
  subSize,
  subMarginTop,
}: {
  torneo: string;
  fecha: string;
  titleSize: number;
  subSize: number;
  subMarginTop: number;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: titleSize,
          lineHeight: 1,
          letterSpacing: titleSize * 0.05,
          color: BRAND,
          textTransform: "uppercase",
        }}
      >
        Resultado
      </div>
      <div
        style={{
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: subSize,
          letterSpacing: subSize * 0.1,
          textTransform: "uppercase",
          color: GRIS,
          marginTop: subMarginTop,
        }}
      >
        {torneo} · {fecha}
      </div>
    </div>
  );
}

function NumOswald({ size, children }: { size: number; children: React.ReactNode }): React.ReactElement {
  return (
    <span style={{ fontFamily: "Oswald", fontWeight: 700, fontSize: size, lineHeight: 1, color: INK }}>
      {children}
    </span>
  );
}

/** Banda cream full-width: escudo — score gigante + chip FINAL — escudo. */
function ScoreBand({
  p,
  homeDataUrl,
  awayDataUrl,
  escudoSize,
  scoreSize,
  padY,
  colGap,
  numsGap,
  chipFs,
  chipPad,
  chipLs,
}: {
  p: PartidoPlacaSrc;
  homeDataUrl: string;
  awayDataUrl: string;
  escudoSize: number;
  scoreSize: number;
  padY: number;
  colGap: number;
  numsGap: number;
  chipFs: number;
  chipPad: string;
  chipLs: number;
}): React.ReactElement {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: CREAM,
        borderTop: "4px solid " + INK,
        borderBottom: "4px solid " + INK,
        padding: `${padY}px 40px`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <img src={homeDataUrl} style={{ width: escudoSize, height: escudoSize, objectFit: "contain" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: colGap }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: numsGap }}>
          <NumOswald size={scoreSize}>{p.homeScore}</NumOswald>
          <span style={{ fontFamily: "Oswald", fontWeight: 700, fontSize: scoreSize * 0.7, lineHeight: 1, color: INK, opacity: 0.45 }}>
            -
          </span>
          <NumOswald size={scoreSize}>{p.awayScore}</NumOswald>
        </div>
        <div
          style={{
            backgroundColor: BRAND,
            color: "#ffffff",
            padding: chipPad,
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: chipFs,
            letterSpacing: chipLs,
            textTransform: "uppercase",
            boxShadow: "4px 4px 0 " + INK,
          }}
        >
          Final
        </div>
      </div>
      <img src={awayDataUrl} style={{ width: escudoSize, height: escudoSize, objectFit: "contain" }} />
    </div>
  );
}

function Nombres({
  home,
  away,
  fs,
}: {
  home: string;
  away: string;
  fs: number;
}): React.ReactElement {
  const cell: React.CSSProperties = {
    fontFamily: "Oswald",
    fontWeight: 600,
    fontSize: fs,
    color: PAPER,
    textTransform: "uppercase",
    width: 460,
    textAlign: "center",
    lineHeight: 1.15,
  };
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 40px" }}>
      <div style={cell}>{home}</div>
      <div style={cell}>{away}</div>
    </div>
  );
}

function Datos({
  estadio,
  ciudadHora,
  estFs,
  ciuFs,
  gap,
}: {
  estadio: string;
  ciudadHora: string;
  estFs: number;
  ciuFs: number;
  gap: number;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap }}>
      <div style={{ fontFamily: "Oswald", fontWeight: 600, fontSize: estFs, color: PAPER, textTransform: "uppercase" }}>
        {estadio}
      </div>
      <div style={{ fontFamily: "Inter", fontWeight: 500, fontSize: ciuFs, color: MUTED }}>{ciudadHora}</div>
    </div>
  );
}

/** CTA naranja estilo Fede: box fijo centrado con texto grande. */
function CtaFixture({
  top,
  left,
  width,
  height,
  fs,
  ls,
  shadowSize,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
  fs: number;
  ls: number;
  shadowSize: number;
}): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        boxSizing: "border-box",
        backgroundColor: BRAND,
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Oswald",
        fontWeight: 600,
        fontSize: fs,
        letterSpacing: ls,
        lineHeight: 1.65,
        textTransform: "uppercase",
        boxShadow: `${shadowSize}px ${shadowSize}px 0 ` + CREAM,
      }}
    >
      Fixture completo {">"}
    </div>
  );
}

// ===================== Placa story (1080×1920) =====================

export function PlacaPartidoStory({
  p,
  homeDataUrl,
  awayDataUrl,
  logoUrl,
}: {
  p: PartidoPlacaSrc;
  homeDataUrl: string;
  awayDataUrl: string;
  logoUrl: string;
}): React.ReactElement {
  return (
    <div
      style={{
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
      <div style={{ position: "absolute", top: 0, left: 0, width: STORY_W, height: 14, backgroundColor: BRAND }} />

      <div style={{ position: "absolute", top: 96, left: 0, width: STORY_W, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ResultadoHeader torneo={p.torneo} fecha={p.fecha} titleSize={118} subSize={32} subMarginTop={14} />
      </div>

      <div style={{ position: "absolute", top: 400, left: 0, width: STORY_W }}>
        <ScoreBand
          p={p}
          homeDataUrl={homeDataUrl}
          awayDataUrl={awayDataUrl}
          escudoSize={330}
          scoreSize={200}
          padY={50}
          colGap={22}
          numsGap={24}
          chipFs={26}
          chipPad="8px 22px"
          chipLs={3.1}
        />
      </div>

      <div style={{ position: "absolute", top: 950, left: 0, width: STORY_W }}>
        <Nombres home={p.home} away={p.away} fs={46} />
      </div>

      <div style={{ position: "absolute", top: 1100, left: 0, width: STORY_W, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Datos estadio={p.estadio} ciudadHora={`${p.ciudad} · ${p.hora} hs`} estFs={40} ciuFs={30} gap={12} />
      </div>

      {/* Footer con mods de Fede: CTA (top 1444-16) + logo grande (top 1444+222) */}
      <CtaFixture top={1428} left={348} width={394} height={93} fs={32} ls={3.5} shadowSize={6} />
      <img src={logoUrl} style={{ position: "absolute", top: 1666, left: 377, width: 342, height: 197 }} />
    </div>
  );
}

// ===================== Placa feed (1080×1350) =====================

export function PlacaPartidoFeed({
  p,
  homeDataUrl,
  awayDataUrl,
  logoUrl,
}: {
  p: PartidoPlacaSrc;
  homeDataUrl: string;
  awayDataUrl: string;
  logoUrl: string;
}): React.ReactElement {
  return (
    <div
      style={{
        width: FEED_W,
        height: FEED_H,
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
          width: FEED_W,
          height: FEED_H,
          backgroundImage: HALFTONE_WHITE_SOFT,
          backgroundSize: "12px 12px",
        }}
      />
      <div style={{ position: "absolute", top: 0, left: 0, width: FEED_W, height: 10, backgroundColor: BRAND }} />

      <div style={{ position: "absolute", top: 64, left: 0, width: FEED_W, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ResultadoHeader torneo={p.torneo} fecha={p.fecha} titleSize={84} subSize={26} subMarginTop={12} />
      </div>

      <div style={{ position: "absolute", top: 260, left: 0, width: FEED_W }}>
        <ScoreBand
          p={p}
          homeDataUrl={homeDataUrl}
          awayDataUrl={awayDataUrl}
          escudoSize={250}
          scoreSize={130}
          padY={36}
          colGap={18}
          numsGap={16}
          chipFs={20}
          chipPad="7px 18px"
          chipLs={2.4}
        />
      </div>

      <div style={{ position: "absolute", top: 650, left: 0, width: FEED_W }}>
        <Nombres home={p.home} away={p.away} fs={36} />
      </div>

      <div style={{ position: "absolute", top: 770, left: 0, width: FEED_W, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Datos estadio={p.estadio} ciudadHora={`${p.ciudad} · ${p.hora} hs`} estFs={30} ciuFs={24} gap={10} />
      </div>

      <CtaFixture top={986} left={365} width={350} height={70} fs={26} ls={2.8} shadowSize={5} />
      <img src={logoUrl} style={{ position: "absolute", top: 1160, left: 400, width: 280, height: 161 }} />
    </div>
  );
}

// ===================== Generadores =====================

/** PNGs story 9:16 de los partidos dados. Falla si un escudo no se puede bajar. */
export async function generarPlacasPartidoStory(srcs: PartidoPlacaSrc[]): Promise<PartidoPlacaPng[]> {
  const fonts = await loadFonts();
  const logo = await loadLogoWhite();
  const placas: PartidoPlacaPng[] = [];
  for (const p of srcs) {
    const [home, away] = await Promise.all([
      fetchEscudoDataUrl(p.escudoHomeUrl),
      fetchEscudoDataUrl(p.escudoAwayUrl),
    ]);
    const el = <PlacaPartidoStory p={p} homeDataUrl={home} awayDataUrl={away} logoUrl={logo} />;
    const png = await render(el, { width: STORY_W, height: STORY_H, fonts });
    placas.push({ slug: p.slug, png: Buffer.from(png) });
  }
  return placas;
}

/** PNGs feed 4:5 de los partidos dados. Falla si un escudo no se puede bajar. */
export async function generarPlacasPartidoFeed(srcs: PartidoPlacaSrc[]): Promise<PartidoPlacaPng[]> {
  const fonts = await loadFonts();
  const logo = await loadLogoWhite();
  const placas: PartidoPlacaPng[] = [];
  for (const p of srcs) {
    const [home, away] = await Promise.all([
      fetchEscudoDataUrl(p.escudoHomeUrl),
      fetchEscudoDataUrl(p.escudoAwayUrl),
    ]);
    const el = <PlacaPartidoFeed p={p} homeDataUrl={home} awayDataUrl={away} logoUrl={logo} />;
    const png = await render(el, { width: FEED_W, height: FEED_H, fonts });
    placas.push({ slug: p.slug, png: Buffer.from(png) });
  }
  return placas;
}