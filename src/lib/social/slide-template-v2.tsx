import React from "react";
import { sectionConfig, type Section } from "@/lib/types";

/** 5 layouts variados para romper la monotonía del mosaico IG/FB.
 *  Round-robin: fullbleed → titular → cita → dato → cta → repite.
 *  Logo sin chip: white en fondos oscuros, dark en fondos claros. */

export type SlideLayout = "fullbleed" | "titular" | "cita" | "dato" | "cta";

export const LAYOUT_ORDER: SlideLayout[] = ["fullbleed", "titular", "cita", "dato", "cta"];

export interface SlideDataV2 {
  title: string;
  section: Section;
  imageDataUrl: string;
  /** data URL del logo WHITE — para fondos oscuros (fullbleed, cita, dato) */
  logoWhiteDataUrl?: string;
  /** data URL del logo DARK — para fondos claros (titular, cta) */
  logoDarkDataUrl?: string;
  excerpt?: string;
  dateLabel?: string;
  sourceLabel?: string;
  layout: SlideLayout;
  quote?: { text: string; author?: string };
  stat?: { value: string; label: string };
}

const INK = "#0a0a0a";
const CREAM = "#f5efe4";
const BRAND = "#f97316";

const HALFTONE_DARK = "radial-gradient(circle, rgba(10,10,10,0.18) 1px, transparent 1.5px)";
const HALFTONE_DARK_SOFT = "radial-gradient(circle, rgba(10,10,10,0.10) 1px, transparent 1.5px)";
const HALFTONE_WHITE = "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.5px)";
const HALFTONE_WHITE_SOFT = "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1.5px)";

export const CARRUSEL_W = 1080;
export const CARRUSEL_H = 1350;
export const STORY_W = 1080;
export const STORY_H = 1920;

function fitN(s: string, max: number): string {
  const c = s.replace(/\s+/g, " ").trim();
  if (c.length <= max) return c;
  const cut = c.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return cut.slice(0, sp > max * 0.7 ? sp : max - 1) + "…";
}

/** Logo sin chip — directo sobre el fondo. */
function Logo({
  logoDataUrl,
  bottom,
  right,
  size,
}: {
  logoDataUrl?: string;
  bottom: number;
  right: number;
  size: number;
}) {
  return React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        bottom,
        right,
        display: "flex",
      },
    },
    logoDataUrl
      ? React.createElement("img", {
          src: logoDataUrl,
          style: { width: size, height: size, objectFit: "contain" },
        })
      : React.createElement(
          "div",
          {
            style: {
              fontFamily: "Oswald",
              fontWeight: 700,
              fontSize: 28,
              color: "#ffffff",
              letterSpacing: 1,
            },
          },
          "QN",
        ),
  );
}

function WebText({
  inkColor,
  bottom,
  left,
  fontSize = 24,
}: {
  inkColor: string;
  bottom: number;
  left: number;
  fontSize?: number;
}) {
  return React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        bottom,
        left,
        display: "flex",
        fontFamily: "Oswald",
        fontWeight: 600,
        fontSize,
        letterSpacing: 0.5,
      },
    },
    React.createElement("span", { style: { color: BRAND } }, "que"),
    React.createElement("span", { style: { color: inkColor } }, "noticia.com.ar"),
  );
}

function Chip({
  label,
  color,
  top,
  left,
  fontSize = 26,
  textColor = "#ffffff",
}: {
  label: string;
  color: string;
  top: number;
  left: number;
  fontSize?: number;
  textColor?: string;
}) {
  return React.createElement(
    "div",
    {
      style: {
        position: "absolute",
        top,
        left,
        display: "flex",
        backgroundColor: color,
        color: textColor,
        fontFamily: "Oswald",
        fontWeight: 700,
        fontSize,
        letterSpacing: 2,
        padding: "10px 22px",
        textTransform: "uppercase",
      },
    },
    label,
  );
}

function HalftoneBar({
  bg,
  top,
  left,
  width,
  height = 10,
  size = "6px",
}: {
  bg: string;
  top: number;
  left: number;
  width: number;
  height?: number;
  size?: string;
}) {
  return React.createElement("div", {
    style: { position: "absolute", top, left, width, height, backgroundImage: bg, backgroundSize: size },
  });
}

// ============================================================
//  CARRUSEL 1080×1350
// ============================================================

function CarruselFullBleed(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("img", { src: data.imageDataUrl, style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, objectFit: "cover" } }),
    React.createElement("div", { style: { position: "absolute", top: 480, left: 0, width: CARRUSEL_W, height: 870, background: "linear-gradient(to top, rgba(10,10,10,0.95), rgba(10,10,10,0))" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 60, left: 60 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 820, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 68, lineHeight: 1.08, color: "#ffffff" } },
      fitN(data.title, 80),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE_SOFT, top: 1170, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselTitular(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: CREAM } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: 12, backgroundColor: cfg.color } }),
    React.createElement("div", { style: { position: "absolute", top: 0, right: 0, width: 400, height: 240, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "8px 8px" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 90, left: 60 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 340, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 98, lineHeight: 1.02, color: INK, textTransform: "uppercase" } },
      fitN(data.title, 44),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_DARK, top: 880, left: 60, width: 960, height: 10 }),
    data.excerpt &&
      React.createElement(
        "div",
        { style: { position: "absolute", top: 920, left: 60, width: 960, display: "flex", fontFamily: "Inter", fontWeight: 400, fontSize: 28, lineHeight: 1.4, color: "#6b5d4f" } },
        fitN(data.excerpt, 160),
      ),
    React.createElement(WebText, { inkColor: INK, bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoDarkDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselCita(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const quote = data.quote;
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: 12, backgroundColor: BRAND } }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 40, left: 40, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 320, lineHeight: 0.8, color: BRAND } },
      "\u201C",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 420, left: 80, width: 920, display: "flex", fontFamily: "Oswald", fontWeight: 500, fontSize: 66, lineHeight: 1.22, color: "#ffffff" } },
      quote ? fitN(quote.text, 140) : fitN(data.title, 110),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 940, left: 80, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 28, color: BRAND, letterSpacing: 0.5 } },
      quote?.author ? `\u2014 ${quote.author}` : `\u2014 ${cfg.label}`,
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 1100, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselDato(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const stat = data.stat;
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: cfg.color } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(Chip, { label: cfg.label, color: INK, top: 60, left: 60 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 300, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 240, lineHeight: 1, color: "#ffffff", justifyContent: "center" } },
      stat ? stat.value : "—",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 600, left: 80, width: 920, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 48, lineHeight: 1.3, color: "#ffffff", justifyContent: "center", textAlign: "center" } },
      stat ? stat.label : fitN(data.title, 70),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 870, left: 60, width: 960, height: 8 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 910, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 600, fontSize: 40, lineHeight: 1.2, color: "#ffffff" } },
      fitN(data.title, 60),
    ),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

function CarruselCta(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: CARRUSEL_W, height: CARRUSEL_H, position: "relative", fontFamily: "Inter", backgroundColor: BRAND } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: CARRUSEL_W, height: CARRUSEL_H, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(Chip, { label: cfg.label, color: INK, top: 60, left: 60 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 340, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 74, lineHeight: 1.08, color: INK } },
      fitN(data.title, 54),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 800, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 50, color: INK, alignItems: "center" } },
      "Leé la nota completa",
      React.createElement("span", { style: { marginLeft: 16, fontSize: 50 } }, "\u2192"),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 920, left: 60, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 32, color: INK, letterSpacing: 0.5 } },
      "quenoticia.com.ar",
    ),
    React.createElement(Logo, { logoDataUrl: data.logoDarkDataUrl, bottom: 24, right: 60, size: 150 }),
  );
}

// ============================================================
//  STORIES 1080×1920
// ============================================================

function StoryFullBleed(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("img", { src: data.imageDataUrl, style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, objectFit: "cover" } }),
    React.createElement("div", { style: { position: "absolute", top: 880, left: 0, width: STORY_W, height: 1040, background: "linear-gradient(to top, rgba(10,10,10,0.96), rgba(10,10,10,0))" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 60, left: 60, fontSize: 30 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1180, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 84, lineHeight: 1.08, color: "#ffffff" } },
      fitN(data.title, 70),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE_SOFT, top: 1700, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryTitular(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: CREAM } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: 14, backgroundColor: cfg.color } }),
    React.createElement("div", { style: { position: "absolute", top: 0, right: 0, width: 440, height: 300, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "8px 8px" } }),
    React.createElement(Chip, { label: cfg.label, color: cfg.color, top: 100, left: 60, fontSize: 30 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 480, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 118, lineHeight: 1.02, color: INK, textTransform: "uppercase" } },
      fitN(data.title, 46),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_DARK, top: 1300, left: 60, width: 960, height: 12 }),
    data.excerpt &&
      React.createElement(
        "div",
        { style: { position: "absolute", top: 1360, left: 60, width: 960, display: "flex", fontFamily: "Inter", fontWeight: 400, fontSize: 32, lineHeight: 1.4, color: "#6b5d4f" } },
        fitN(data.excerpt, 180),
      ),
    React.createElement(WebText, { inkColor: INK, bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoDarkDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryCita(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const quote = data.quote;
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: INK } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: 14, backgroundColor: BRAND } }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 60, left: 40, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 480, lineHeight: 0.8, color: BRAND } },
      "\u201C",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 640, left: 80, width: 920, display: "flex", fontFamily: "Oswald", fontWeight: 500, fontSize: 78, lineHeight: 1.22, color: "#ffffff" } },
      quote ? fitN(quote.text, 180) : fitN(data.title, 130),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1360, left: 80, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 34, color: BRAND, letterSpacing: 0.5 } },
      quote?.author ? `\u2014 ${quote.author}` : `\u2014 ${cfg.label}`,
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 1620, left: 60, width: 960, height: 8 }),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryDato(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  const stat = data.stat;
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: cfg.color } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, backgroundImage: HALFTONE_WHITE_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(Chip, { label: cfg.label, color: INK, top: 60, left: 60, fontSize: 30 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 460, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 340, lineHeight: 1, color: "#ffffff", justifyContent: "center" } },
      stat ? stat.value : "—",
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 860, left: 80, width: 920, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 54, lineHeight: 1.3, color: "#ffffff", justifyContent: "center", textAlign: "center" } },
      stat ? stat.label : fitN(data.title, 80),
    ),
    React.createElement(HalftoneBar, { bg: HALFTONE_WHITE, top: 1280, left: 60, width: 960, height: 8 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1340, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 600, fontSize: 46, lineHeight: 1.2, color: "#ffffff" } },
      fitN(data.title, 70),
    ),
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 48, left: 60, fontSize: 26 }),
    React.createElement(Logo, { logoDataUrl: data.logoWhiteDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

function StoryCta(data: SlideDataV2): React.ReactElement {
  const cfg = sectionConfig[data.section];
  return React.createElement(
    "div",
    { style: { display: "flex", width: STORY_W, height: STORY_H, position: "relative", fontFamily: "Inter", backgroundColor: BRAND } },
    React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: STORY_W, height: STORY_H, backgroundImage: HALFTONE_DARK_SOFT, backgroundSize: "10px 10px" } }),
    React.createElement(Chip, { label: cfg.label, color: INK, top: 100, left: 60, fontSize: 30 }),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 500, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 84, lineHeight: 1.08, color: INK } },
      fitN(data.title, 54),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1140, left: 60, width: 960, display: "flex", fontFamily: "Oswald", fontWeight: 700, fontSize: 56, color: INK, alignItems: "center" } },
      "Leé la nota completa",
      React.createElement("span", { style: { marginLeft: 18, fontSize: 56 } }, "\u2192"),
    ),
    React.createElement(
      "div",
      { style: { position: "absolute", top: 1310, left: 60, display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 36, color: INK, letterSpacing: 0.5 } },
      "quenoticia.com.ar",
    ),
    React.createElement(Logo, { logoDataUrl: data.logoDarkDataUrl, bottom: 24, right: 60, size: 180 }),
  );
}

// ============================================================
//  Exports
// ============================================================

const CARRUSEL_LAYOUTS: Record<SlideLayout, (d: SlideDataV2) => React.ReactElement> = {
  fullbleed: CarruselFullBleed,
  titular: CarruselTitular,
  cita: CarruselCita,
  dato: CarruselDato,
  cta: CarruselCta,
};

const STORY_LAYOUTS: Record<SlideLayout, (d: SlideDataV2) => React.ReactElement> = {
  fullbleed: StoryFullBleed,
  titular: StoryTitular,
  cita: StoryCita,
  dato: StoryDato,
  cta: StoryCta,
};

export function SlideTemplateV2(data: SlideDataV2): React.ReactElement {
  return (CARRUSEL_LAYOUTS[data.layout] ?? CarruselFullBleed)(data);
}

export function SlideTemplateStoryV2(data: SlideDataV2): React.ReactElement {
  return (STORY_LAYOUTS[data.layout] ?? StoryFullBleed)(data);
}