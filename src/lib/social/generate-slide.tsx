import { render } from "takumi-js";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFonts } from "./fonts";
import { SlideTemplate, SlideTemplateStory, STORY_WIDTH, STORY_HEIGHT, type SlideData } from "./slide-template";
import { SlideTemplateV2, SlideTemplateStoryV2, type SlideDataV2 } from "./slide-template-v2";
import { SeparadorTemplate, type SeparadorData, type SeparadorLayout } from "./separador-template";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_DARK_PATH = join(__dirname, "..", "..", "..", "public", "logo", "logodesktop.png");
const LOGO_WHITE_PATH = join(__dirname, "..", "..", "..", "public", "logo", "logo-white.png");

const WIDTH = 1080;
const HEIGHT = 1350;

let logoDarkCache: string | null = null;
let logoWhiteCache: string | null = null;

async function loadLogoDark(): Promise<string> {
  if (logoDarkCache) return logoDarkCache;
  try {
    const buf = await readFile(LOGO_DARK_PATH);
    logoDarkCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("loadLogoDark: no se pudo leer logodesktop.png, fallback a placeholder:", err);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><text x="0" y="36" font-family="Oswald,Arial,sans-serif" font-weight="700" font-size="34" fill="#0a0a0a">¡QUE NOTICIA!</text></svg>`;
    logoDarkCache = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return logoDarkCache;
}

async function loadLogoWhite(): Promise<string> {
  if (logoWhiteCache) return logoWhiteCache;
  try {
    const buf = await readFile(LOGO_WHITE_PATH);
    logoWhiteCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("loadLogoWhite: no se pudo leer logo-white.png, fallback a placeholder:", err);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><text x="0" y="36" font-family="Oswald,Arial,sans-serif" font-weight="700" font-size="34" fill="#ffffff">¡QUE NOTICIA!</text></svg>`;
    logoWhiteCache = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return logoWhiteCache;
}

/** Descarga una imagen, la normaliza a PNG con sharp (el renderer no soporta
 *  todos los formatos raros como WebP) y la devuelve como data URL base64. */
async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`fetch image ${url} → ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  const png = await sharp(raw).flatten({ background: "#ffffff" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/** Normaliza la portada a data URL. Si viene vacía → placeholder cream.
 *  Si viene URL HTTP → descarga + convierte a PNG. Si ya es data URL → pasa. */
async function normalizeImage(imageDataUrl: string, fallbackW: number, fallbackH: number): Promise<string> {
  if (!imageDataUrl || imageDataUrl.trim() === "") {
    return "data:image/svg+xml;base64," +
      Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${fallbackW}" height="${fallbackH}"><rect width="100%" height="100%" fill="#f5efe4"/></svg>`).toString("base64");
  }
  if (imageDataUrl.startsWith("http")) {
    try {
      return await fetchImageAsDataUrl(imageDataUrl);
    } catch (err) {
      console.error("generate-slide: no se pudo descargar portada, fallback sin imagen:", err);
      return "data:image/svg+xml;base64," +
        Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${fallbackW}" height="${fallbackH}"><rect width="100%" height="100%" fill="#f5efe4"/></svg>`).toString("base64");
    }
  }
  return imageDataUrl;
}

function isV2(data: SlideData | SlideDataV2): data is SlideDataV2 {
  return "layout" in data;
}

/** Genera un PNG 1080×1350 a partir de los datos del slide.
 *  Si data.layout viene, usa SlideTemplateV2 (5 layouts variados).
 *  Si no, usa el SlideTemplate viejo (agenda events con chip/venue, retry, manual). */
export async function generateSlidePng(data: SlideData | SlideDataV2): Promise<Buffer> {
  const fonts = await loadFonts();
  const imageDataUrl = await normalizeImage(data.imageDataUrl, WIDTH, HEIGHT);

  if (isV2(data)) {
    const [logoWhite, logoDark] = await Promise.all([loadLogoWhite(), loadLogoDark()]);
    const png = await render(
      <SlideTemplateV2
        {...data}
        imageDataUrl={imageDataUrl}
        logoWhiteDataUrl={logoWhite}
        logoDarkDataUrl={logoDark}
      />,
      { width: WIDTH, height: HEIGHT, fonts },
    );
    return Buffer.from(png);
  }

  // Path viejo (agenda / retry / manual)
  const logoDataUrl = await loadLogoDark();
  const png = await render(
    <SlideTemplate
      title={data.title}
      section={data.section}
      imageDataUrl={imageDataUrl}
      logoDataUrl={logoDataUrl}
      excerpt={data.excerpt}
      dateLabel={data.dateLabel}
      sourceLabel={data.sourceLabel}
      chip={(data as SlideData).chip}
      venue={(data as SlideData).venue}
    />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
  return Buffer.from(png);
}

/** Genera un PNG 1080×1920 (9:16) para stories IG/FB.
 *  Siempre usa SlideTemplateStoryV2 (5 layouts variados). */
export async function generateStoryPng(data: SlideDataV2): Promise<Buffer> {
  const fonts = await loadFonts();
  const [logoWhite, logoDark] = await Promise.all([loadLogoWhite(), loadLogoDark()]);
  const imageDataUrl = await normalizeImage(data.imageDataUrl, STORY_WIDTH, STORY_HEIGHT);

  const png = await render(
    <SlideTemplateStoryV2
      {...data}
      imageDataUrl={imageDataUrl}
      logoWhiteDataUrl={logoWhite}
      logoDarkDataUrl={logoDark}
    />,
    { width: STORY_WIDTH, height: STORY_HEIGHT, fonts },
  );
  return Buffer.from(png);
}

/** Genera un PNG 1080×1350 para una placa separadora del feed (promo del sitio).
 *  3 layouts: branding, secciones, cta. No usa imagen ni excerpt. */
export async function generateSeparadorPng(layout: SeparadorLayout): Promise<Buffer> {
  const fonts = await loadFonts();
  const [logoWhite, logoDark] = await Promise.all([loadLogoWhite(), loadLogoDark()]);
  const data: SeparadorData = {
    layout,
    logoWhiteDataUrl: logoWhite,
    logoDarkDataUrl: logoDark,
  };
  const png = await render(<SeparadorTemplate {...data} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });
  return Buffer.from(png);
}