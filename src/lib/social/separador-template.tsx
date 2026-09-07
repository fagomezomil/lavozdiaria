import React from "react";
import { sectionConfig } from "@/lib/types";
import {
  INK,
  CREAM,
  BRAND,
  HALFTONE_DARK_SOFT,
  HALFTONE_WHITE_SOFT,
  CARRUSEL_W,
  CARRUSEL_H,
  WebText,
} from "./slide-template-v2";

interface PlacaSection {
  label: string;
  color: string;
}

// 6 secciones del site + agenda (feature aparte, no está en sectionConfig)
const AGENDA_COLOR = "#ec4899"; // rosa
const SECCIONES_PLACA: PlacaSection[] = [
  { label: sectionConfig.politica.label, color: sectionConfig.politica.color },
  { label: sectionConfig.deportes.label, color: sectionConfig.deportes.color },
  { label: sectionConfig.economia.label, color: sectionConfig.economia.color },
  { label: sectionConfig.internacionales.label, color: sectionConfig.internacionales.color },
  { label: sectionConfig.tucuman.label, color: sectionConfig.tucuman.color },
  { label: sectionConfig.opinion.label, color: sectionConfig.opinion.color },
  { label: "Agenda", color: AGENDA_COLOR },
];

/** 3 placas separadoras del feed IG/FB — publican cada 9 carruseles via cron.
 *  No son noticias, son promo del sitio. 1080x1350 (mismo aspect ratio que el carrusel).
 *
 *  - SeparadorBranding: fondo ink + halftone naranja, logo blanco al 80% del ancho.
 *  - SeparadorSecciones: fondo cream, 6 secciones verticales alineadas a la izquierda.
 *  - SeparadorCta: fondo naranja full, CTA "no te pierdas toda la actualidad" + URL.
 *
 *  Reutiliza WebText y tokens de slide-template-v2. */

export type SeparadorLayout = "branding" | "secciones" | "cta";

export interface SeparadorData {
  layout: SeparadorLayout;
  logoWhiteDataUrl?: string;
  logoDarkDataUrl?: string;
}

/** Placa 1 BRANDING: ink + halftone naranja, logo blanco al 80% del ancho + URL abajo. */
export function SeparadorBranding(data: SeparadorData): React.ReactElement {
  const logoW = Math.round(CARRUSEL_W * 0.9); // 972px
  const logoLeft = Math.round((CARRUSEL_W - logoW) / 2); // 54px centrado

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        width: CARRUSEL_W,
        height: CARRUSEL_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
      },
    },
    // Halftone naranja sutil sobre todo el fondo
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: CARRUSEL_W,
        height: CARRUSEL_H,
        backgroundImage: HALFTONE_WHITE_SOFT,
        backgroundSize: "12px 12px",
      },
    }),
    // Barra superior naranja
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: CARRUSEL_W,
        height: 12,
        backgroundColor: BRAND,
      },
    }),
    // Logo blanco al 80% del ancho, centrado verticalmente
    data.logoWhiteDataUrl
      ? React.createElement("img", {
          src: data.logoWhiteDataUrl,
          style: {
            position: "absolute",
            top: 380,
            left: logoLeft,
            width: logoW,
            height: logoW * 0.4, // alto estimado proporcional al ancho
            objectFit: "contain",
          },
        })
      : React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              top: 500,
              left: logoLeft,
              width: logoW,
              display: "flex",
              fontFamily: "Oswald",
              fontWeight: 700,
              fontSize: 110,
              color: "#ffffff",
              justifyContent: "center",
            },
          },
          "¡QUE NOTICIA!",
        ),
    // WebText abajo (sin Logo chico para no repetir)
    React.createElement(WebText, { inkColor: "#ffffff", bottom: 60, left: 60 }),
  );
}

/** Placa 2 SECCIONES: 7 secciones en filas de 2, centradas, texto blanco. */
export function SeparadorSecciones(data: SeparadorData): React.ReactElement {
  const gap = 18;

  function chip(sec: PlacaSection, key: string | number): React.ReactElement {
    return React.createElement(
      "div",
      {
        key,
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "22px 50px",
          backgroundColor: sec.color,
          color: "#ffffff",
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: 1,
          textTransform: "uppercase",
          boxShadow: "6px 6px 0 #0a0a0a",
        },
      },
      sec.label,
    );
  }

  function row(items: React.ReactElement[], key: string | number): React.ReactElement {
    return React.createElement(
      "div",
      {
        key,
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap,
        },
      },
      ...items,
    );
  }

  // 4 filas: 2+2+2+1 (agenda sola centrada)
  const rows = [
    row([chip(SECCIONES_PLACA[0], "r1c1"), chip(SECCIONES_PLACA[1], "r1c2")], "row1"),
    row([chip(SECCIONES_PLACA[2], "r2c1"), chip(SECCIONES_PLACA[3], "r2c2")], "row2"),
    row([chip(SECCIONES_PLACA[4], "r3c1"), chip(SECCIONES_PLACA[5], "r3c2")], "row3"),
    row([chip(SECCIONES_PLACA[6], "r4c1")], "row4"),
  ];

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: CARRUSEL_W,
        height: CARRUSEL_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: CREAM,
      },
    },
    // Borde superior ink
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: CARRUSEL_W,
        height: 12,
        backgroundColor: INK,
      },
    }),
    // Subheader centrado en 2 líneas (fontSize 62 = +15)
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          top: 200,
          left: 0,
          width: CARRUSEL_W,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 62,
          color: BRAND,
          letterSpacing: 0.5,
          textAlign: "center",
        },
      },
      React.createElement("div", null, "Las secciones"),
      React.createElement("div", null, "que nos importan"),
    ),
    // 7 secciones en filas de 2 (agenda sola al final), centradas
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          top: 440,
          left: 0,
          width: CARRUSEL_W,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap,
        },
      },
      ...rows,
    ),
    // WebText abajo (sin logo chico)
    React.createElement(WebText, { inkColor: INK, bottom: 48, left: 60 }),
  );
}

/** Placa 3 CTA: naranja full, "no te pierdas toda la actualidad" (blanco) + URL blanca. */
export function SeparadorCta(data: SeparadorData): React.ReactElement {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        width: CARRUSEL_W,
        height: CARRUSEL_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: BRAND,
      },
    },
    // Halftone ink sutil
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: CARRUSEL_W,
        height: CARRUSEL_H,
        backgroundImage: HALFTONE_DARK_SOFT,
        backgroundSize: "12px 12px",
      },
    }),
    // Borde superior ink
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: CARRUSEL_W,
        height: 12,
        backgroundColor: INK,
      },
    }),
    // Frase principal (blanco, fontSize 92 = +10, en 3 líneas)
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          top: 380,
          left: 60,
          width: 960,
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter",
          fontWeight: 600,
          fontSize: 92,
          lineHeight: 1.15,
          color: "#ffffff",
        },
      },
      React.createElement("div", null, "No te pierdas"),
      React.createElement("div", null, "toda"),
      React.createElement("div", null, "la actualidad."),
    ),
    // Halftone bar separadora
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 800,
        left: 60,
        width: 960,
        height: 8,
        backgroundImage: HALFTONE_DARK_SOFT,
        backgroundSize: "6px 6px",
      },
    }),
    // URL blanco con flecha
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          top: 870,
          left: 60,
          width: 960,
          display: "flex",
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 80,
          color: "#ffffff",
          alignItems: "center",
        },
      },
      "quenoticia.com.ar",
      React.createElement("span", { style: { marginLeft: 20, fontSize: 80 } }, "\u2192"),
    ),
  );
}

const SEPARADOR_LAYOUTS: Record<
  SeparadorLayout,
  (d: SeparadorData) => React.ReactElement
> = {
  branding: SeparadorBranding,
  secciones: SeparadorSecciones,
  cta: SeparadorCta,
};

export function SeparadorTemplate(data: SeparadorData): React.ReactElement {
  return (SEPARADOR_LAYOUTS[data.layout] ?? SeparadorBranding)(data);
}