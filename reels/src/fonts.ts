/** Fuentes embebidas base64 (fonts-base64.ts) — sin asset server ni fetch externo.
 *  AVG MITM rompía Google Fonts; con data: URLs no hay nada que descargar. */

import { continueRender, delayRender } from "remotion";
import { FONT_FACES } from "./fonts-base64";

export const OSWALD = "Oswald";
export const INTER = "Inter";

const style = document.createElement("style");
style.textContent = FONT_FACES.map(
  (f) =>
    `@font-face { font-family: '${f.family}'; font-weight: ${f.weight}; font-style: normal; ` +
    `src: url(data:font/woff;base64,${f.b64}) format('woff'); }`,
).join("\n");
document.head.appendChild(style);

const timeout = delayRender("cargando fuentes");
// document.fonts.load() FUERZA la descarga de cada @font-face (fonts.ready
// solo resuelve para fuentes ya solicitadas — race en render headless).
Promise.all(
  FONT_FACES.map((f) => document.fonts.load(`${f.weight} 100px '${f.family}'`)),
)
  .then(() => continueRender(timeout))
  .catch(() => continueRender(timeout));