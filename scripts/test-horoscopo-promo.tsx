/** Test visual de la placa promo horóscopo: genera los 2 PNGs (carrusel + story). */
import { mkdirSync, writeFileSync } from "node:fs";
import { generateHoroscopoPromoPng } from "../src/lib/social/generate-slide";

async function main() {
  mkdirSync("scripts/out", { recursive: true });
  const carrusel = await generateHoroscopoPromoPng("carrusel");
  writeFileSync("scripts/out/horoscopo-promo-carrusel.png", carrusel);
  console.log("carrusel:", carrusel.length, "bytes");
  const story = await generateHoroscopoPromoPng("story");
  writeFileSync("scripts/out/horoscopo-promo-story.png", story);
  console.log("story:", story.length, "bytes");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});