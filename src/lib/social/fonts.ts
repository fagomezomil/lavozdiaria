import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, "..", "..", "assets", "fonts");

export type FontFamily = "Oswald" | "Inter";

export interface SatoriFont {
  name: FontFamily;
  data: Buffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal";
}

let cache: SatoriFont[] | null = null;

/** Carga las fonts físicas (.woff) como Buffer para Satori.
 *  Satori soporta TTF/OTF/WOFF (no WOFF2). Latin subset es suficiente para es-AR. */
export async function loadFonts(): Promise<SatoriFont[]> {
  if (cache) return cache;

  const files: Array<{ name: FontFamily; weight: 400 | 500 | 600 | 700; file: string }> = [
    { name: "Oswald", weight: 400, file: "Oswald-Regular.woff" },
    { name: "Oswald", weight: 500, file: "Oswald-Medium.woff" },
    { name: "Oswald", weight: 600, file: "Oswald-SemiBold.woff" },
    { name: "Oswald", weight: 700, file: "Oswald-Bold.woff" },
    { name: "Inter", weight: 400, file: "Inter-Regular.woff" },
    { name: "Inter", weight: 500, file: "Inter-Medium.woff" },
    { name: "Inter", weight: 600, file: "Inter-SemiBold.woff" },
    { name: "Inter", weight: 700, file: "Inter-Bold.woff" },
  ];

  cache = await Promise.all(
    files.map(async (f) => ({
      name: f.name,
      data: await readFile(join(FONTS_DIR, f.file)),
      weight: f.weight,
      style: "normal" as const,
    })),
  );

  return cache;
}