/** Test render de los 5 layouts v2 (carrusel + stories) con contenido placeholder.
 *  Correr en VPS:
 *    NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/test-slide-layouts.ts
 *  Output: 10 PNGs en /tmp/test-slides/
 */
import { render } from "takumi-js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { loadFonts } from "@/lib/social/fonts";
import {
  SlideTemplateV2,
  SlideTemplateStoryV2,
  LAYOUT_ORDER,
  type SlideDataV2,
} from "@/lib/social/slide-template-v2";
import { sectionConfig, type Section } from "@/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_WHITE = join(__dirname, "..", "public", "logo", "logo-white.png");
const LOGO_DARK = join(__dirname, "..", "public", "logo", "logodesktop.png");

function placeholderImg(color: string, w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/><text x="${w / 2}" y="${h / 2}" font-family="Arial" font-size="52" fill="rgba(255,255,255,0.5)" text-anchor="middle" dominant-baseline="middle">FOTO</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  const fonts = await loadFonts();
  const logoWhiteBuf = await readFile(LOGO_WHITE);
  const logoWhiteDataUrl = `data:image/png;base64,${logoWhiteBuf.toString("base64")}`;
  const logoDarkBuf = await readFile(LOGO_DARK);
  const logoDarkDataUrl = `data:image/png;base64,${logoDarkBuf.toString("base64")}`;

  const sections: Section[] = ["politica", "deportes", "economia", "internacionales", "tucuman"];

  const outDir = "/tmp/test-slides";
  await mkdir(outDir, { recursive: true });

  for (let i = 0; i < LAYOUT_ORDER.length; i++) {
    const layout = LAYOUT_ORDER[i];
    const section = sections[i];
    const cfg = sectionConfig[section];

    const data: SlideDataV2 = {
      title:
        "El título de la nota va acá y puede ser algo largo para probar cómo trunca cada layout",
      section,
      imageDataUrl: placeholderImg(cfg.color, 1080, 1350),
      logoWhiteDataUrl,
      logoDarkDataUrl,
      excerpt:
        "Esta es la bajada de respaldo, un texto de apoyo que va debajo del título en los layouts que tienen espacio.",
      dateLabel: "04/09/2026",
      sourceLabel: "Contexto",
      layout,
      quote: {
        text: "Esta es una cita extraída del cuerpo de la nota que ilustra el punto central del artículo de forma directa.",
        author: "Juan Pérez, analista",
      },
      stat: { value: "42%", label: "de los tucumanos apoya la nueva medida provincial" },
    };

    // Carrusel 1080×1350
    const png1 = await render(<SlideTemplateV2 {...data} />, {
      width: 1080,
      height: 1350,
      fonts,
    });
    await writeFile(join(outDir, `carrusel-${i}-${layout}.png`), Buffer.from(png1));
    console.log(`✓ carrusel ${i} ${layout}`);

    // Story 1080×1920 — placeholder con dimensiones story
    const dataStory = { ...data, imageDataUrl: placeholderImg(cfg.color, 1080, 1920) };
    const png2 = await render(<SlideTemplateStoryV2 {...dataStory} />, {
      width: 1080,
      height: 1920,
      fonts,
    });
    await writeFile(join(outDir, `story-${i}-${layout}.png`), Buffer.from(png2));
    console.log(`✓ story ${i} ${layout}`);
  }

  console.log(`\nListo. 10 PNGs en ${outDir}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});