import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFonts } from "./fonts";
import { SlideTemplate, type SlideData } from "./slide-template";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = join(__dirname, "..", "..", "..", "public", "logo", "logodesktop.png");

const WIDTH = 1080;
const HEIGHT = 1350;

let logoCache: string | null = null;

async function loadLogo(): Promise<string> {
  if (logoCache) return logoCache;
  try {
    const buf = await readFile(LOGO_PATH);
    logoCache = `data:image/png;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("loadLogo: no se pudo leer logodesktop.png, fallback a placeholder:", err);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48"><text x="0" y="36" font-family="Oswald,Arial,sans-serif" font-weight="700" font-size="34" fill="#0a0a0a">¡QUE NOTICIA!</text></svg>`;
    logoCache = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return logoCache;
}

/** Descarga una imagen, la normaliza a PNG con sharp (Satori no soporta WebP
 *  ni otros formatos raros) y la devuelve como data URL base64. */
async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`fetch image ${url} → ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  // sharp convierte cualquier formato (JPEG, PNG, WebP, GIF, AVIF) → PNG.
  // flatten con fondo blanco para que imágenes con transparencia no queden raras.
  const png = await sharp(raw).flatten({ background: "#ffffff" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/** Genera un PNG 1080×1350 a partir de los datos del slide.
 *  Pipeline: SlideData → Satori (JSX → SVG) → Resvg (SVG → PNG). */
export async function generateSlidePng(data: SlideData): Promise<Buffer> {
  const fonts = await loadFonts();
  const logoDataUrl = await loadLogo();

  // Si la portada viene como URL externa, inlinearla a data URL
  let imageDataUrl = data.imageDataUrl;
  if (!imageDataUrl || imageDataUrl.trim() === "") {
    // Nota sin image_url: placeholder blanco para que Satori no tire
    // "Image source is not provided".
    imageDataUrl =
      "data:image/svg+xml;base64," +
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="620"><rect width="100%" height="100%" fill="#f5efe4"/></svg>`,
      ).toString("base64");
  } else if (imageDataUrl.startsWith("http")) {
    try {
      imageDataUrl = await fetchImageAsDataUrl(imageDataUrl);
    } catch (err) {
      console.error("generate-slide: no se pudo descargar portada, fallback sin imagen:", err);
      imageDataUrl =
        "data:image/svg+xml;base64," +
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="620"><rect width="100%" height="100%" fill="#f5efe4"/></svg>`,
        ).toString("base64");
    }
  }

  const svg = await satori(
    <SlideTemplate
      title={data.title}
      section={data.section}
      imageDataUrl={imageDataUrl}
      logoDataUrl={logoDataUrl}
      excerpt={data.excerpt}
      dateLabel={data.dateLabel}
      chip={data.chip}
      venue={data.venue}
    />,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts,
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    background: "#ffffff",
  });
  const pngData = resvg.render();
  return pngData.asPng();
}