/** Placa promocional fija de horóscopo para carrusel y stories IG/FB.
 *
 *  Motivo: las notas de la sección horoscopo son 1 por signo — publicarlas como
 *  slide de noticia queda raro. En su lugar, el carrusel/stories llevan UNA placa
 *  estática con el estilo gráfico de la sección (dorado #eab308 sobre ink, cielo
 *  tenue de símbolos zodiacales) y la frase de promo.
 *
 *  Los símbolos zodiacales (U+2648-2653) NO están en Oswald/Inter → se dibujan
 *  con paths SVG propios (decorativos, stroke). La rotación va dentro del SVG
 *  (transform en el <g>) — el layout engine no hace transform en el canvas.
 *
 *  Formatos: carrusel 1080×1350, story 1080×1920. PNG estático → R2 path fijo. */

import React from "react";
import {
  INK,
  CREAM,
  CARRUSEL_W,
  CARRUSEL_H,
  STORY_W,
  STORY_H,
  WebText,
} from "./slide-template-v2";

const GOLD = "#eab308";

/** Paths decorativos por signo (viewBox 0 0 100 100, stroke). Formas aproximadas:
 *  van tenues y gigantes de fondo, la precisión milimétrica no importa. */
const ZODIAC: Record<string, string> = {
  aries: `<path d="M30 74 C30 38 40 26 50 26 C60 26 70 38 70 74"/>`,
  tauro: `<circle cx="50" cy="58" r="20"/><path d="M20 40 C26 27 40 31 50 35 C60 31 74 27 80 40"/>`,
  geminis: `<path d="M36 26 V74 M64 26 V74 M30 36 H70 M30 64 H70"/>`,
  cancer: `<circle cx="36" cy="40" r="12"/><path d="M48 40 H70 C76 46 74 54 66 53"/><circle cx="64" cy="60" r="12"/><path d="M52 60 H30 C24 54 26 46 34 47"/>`,
  leo: `<circle cx="40" cy="34" r="10"/><path d="M50 34 C54 56 52 72 40 72 C29 72 27 60 35 58"/>`,
  virgo: `<path d="M28 30 V70 M28 30 C28 42 44 42 44 30 M44 30 V70 M44 30 C44 42 60 42 60 30 M60 30 C60 48 64 64 74 58"/>`,
  libra: `<path d="M32 50 C32 32 44 32 50 42 C56 32 68 32 68 50"/><path d="M26 60 H74 M26 72 H74"/>`,
  escorpio: `<path d="M28 30 V64 M28 30 C28 42 44 42 44 30 M44 30 V64 M44 30 C44 42 60 42 60 30 M60 30 V56 M60 56 L53 49 M60 56 L67 49"/>`,
  sagitario: `<path d="M30 70 L66 34 M54 34 H66 V46 M40 44 L56 60"/>`,
  capricornio: `<path d="M28 28 V56 C28 68 40 70 44 60 C46 54 40 50 36 54 C34 62 44 70 56 66 C64 63 66 52 60 48 C55 45 50 51 54 56"/>`,
  acuario: `<path d="M22 42 C32 34 42 52 52 42 C62 32 72 52 80 42 M22 66 C32 58 42 76 52 66 C62 56 72 76 80 66"/>`,
  piscis: `<path d="M34 24 C18 42 18 58 34 76 M66 24 C82 42 82 58 66 76 M28 50 H72"/>`,
};

function symbolUri(key: string, rotate: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(${rotate} 50 50)" fill="none" stroke="#eab308" stroke-width="5" stroke-linecap="round">${ZODIAC[key]}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Cielo de estrellas determinístico (PRNG lineal, seed fija → mismo PNG siempre). */
function starsUri(count: number, w: number, h: number, seed: number): string {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  let circles = "";
  for (let i = 0; i < count; i++) {
    const x = Math.round(rnd() * w);
    const y = Math.round(rnd() * h);
    const r = (1 + rnd() * 2).toFixed(1);
    const o = (0.15 + rnd() * 0.6).toFixed(2);
    circles += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${o}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${circles}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface SkySymbol {
  key: string;
  size: number;
  top: number;
  left?: number;
  right?: number;
  rotate: number;
}

/** Símbolos tenues de fondo (opacity sobre el img, rotación dentro del SVG). */
const SKY_CARRUSEL: SkySymbol[] = [
  { key: "geminis", size: 300, top: 30, left: 40, rotate: -10 },
  { key: "libra", size: 340, top: 10, right: -60, rotate: 10 },
  { key: "sagitario", size: 380, top: 380, left: -90, rotate: -8 },
  { key: "leo", size: 290, top: 250, right: -50, rotate: 14 },
  { key: "tauro", size: 340, top: 1050, left: 20, rotate: -10 },
  { key: "piscis", size: 360, top: 1000, right: -70, rotate: 8 },
];

const SKY_STORY: SkySymbol[] = [
  { key: "geminis", size: 320, top: 40, left: 50, rotate: -10 },
  { key: "libra", size: 350, top: 20, right: -70, rotate: 10 },
  { key: "sagitario", size: 400, top: 640, left: -100, rotate: -8 },
  { key: "leo", size: 320, top: 500, right: -60, rotate: 14 },
  { key: "tauro", size: 350, top: 1200, left: 20, rotate: -10 },
  { key: "piscis", size: 380, top: 1150, right: -80, rotate: 8 },
  { key: "acuario", size: 400, top: 1580, left: -30, rotate: 6 },
  { key: "escorpio", size: 370, top: 1560, right: -60, rotate: -12 },
];

const CHIP_TOP = { carrusel: 420, story: 640 };
const FRASE_TOP = { carrusel: 650, story: 880 };
const URL_TOP = { carrusel: 1030, story: 1320 };

const FRASE_LINES = [
  "Enterate ahora lo que",
  "los astros tienen para vos",
  "en nuestra nueva sección",
];

export function HoroscopoPromoTemplate({ story }: { story: boolean }): React.ReactElement {
  const w = story ? STORY_W : CARRUSEL_W;
  const h = story ? STORY_H : CARRUSEL_H;
  const sky = story ? SKY_STORY : SKY_CARRUSEL;

  return (
    <div
      style={{
        display: "flex",
        width: w,
        height: h,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
      }}
    >
      {/* Cielo de estrellas */}
      <img
        src={starsUri(story ? 60 : 45, w, h, 20260909)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: w,
          height: h,
        }}
      />
      {/* Símbolos tenues de fondo */}
      {sky.map((s, i) => (
        <img
          key={s.key + i}
          src={symbolUri(s.key, s.rotate)}
          style={{
            position: "absolute",
            top: s.top,
            ...(s.left !== undefined ? { left: s.left } : {}),
            ...(s.right !== undefined ? { right: s.right } : {}),
            width: s.size,
            height: s.size,
            opacity: 0.22,
          }}
        />
      ))}
      {/* Banda superior dorada */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: w,
          height: 12,
          backgroundColor: GOLD,
        }}
      />
      {/* Chip dorado central */}
      <div
        style={{
          position: "absolute",
          top: CHIP_TOP[story ? "story" : "carrusel"],
          left: 0,
          width: w,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            backgroundColor: GOLD,
            color: INK,
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: 96,
            letterSpacing: 10,
            padding: "26px 64px",
            boxShadow: "10px 10px 0 #f5efe4",
          }}
        >
          HORÓSCOPO
        </div>
      </div>
      {/* Frase promo */}
      <div
        style={{
          position: "absolute",
          top: FRASE_TOP[story ? "story" : "carrusel"],
          left: 60,
          width: w - 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 66,
          lineHeight: 1.3,
          color: CREAM,
          textAlign: "center",
        }}
      >
        {FRASE_LINES.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      {/* URL */}
      <div
        style={{
          position: "absolute",
          top: URL_TOP[story ? "story" : "carrusel"],
          left: 0,
          width: w,
          display: "flex",
          justifyContent: "center",
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 60,
          color: GOLD,
          letterSpacing: 1,
        }}
      >
        quenoticia.com.ar
      </div>
      <WebText inkColor="#ffffff" bottom={story ? 80 : 60} left={60} />
    </div>
  );
}