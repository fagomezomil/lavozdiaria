/**
 * build-reel.mjs — orquestador del reel (corre LOCAL en la PC de Fede).
 *
 * Pipeline: query Supabase → selección notas → guion → edge-tts Valentina
 * (1 mp3 por segmento) → ffprobe duraciones → inputProps → render Remotion
 * → scp al VPS → trigger quenoticia-reels.service (R2 + Buffer + social_posts).
 *
 * Uso:
 *   node build-reel.mjs            # full (render + publicar)
 *   node build-reel.mjs --no-push  # render + scp, sin disparar el service
 *   node build-reel.mjs --dry-run  # query + guion + props, sin render
 *
 * Env: reels/.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VPS_HOST, VPS_PORT,
 * EDGE_TTS_VOICE).
 * Requiere: python -m edge_tts, ffprobe/ffmpeg en PATH (winget Gyan.FFmpeg).
 */

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const OUT_DIR = path.join(ROOT, "out");
const INCOMING = "/opt/scraper/reels-incoming";
const FPS = 30;

const dryRun = process.argv.includes("--dry-run");
const noPush = process.argv.includes("--no-push");

/* ============ env ============ */

const envPath = path.join(ROOT, ".env");
for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VPS_HOST, VPS_PORT } = process.env;
const VOICE = process.env.EDGE_TTS_VOICE ?? "es-UY-ValentinaNeural";
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("FALTA SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en reels/.env");
  process.exit(1);
}
const sbHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

const log = (obj) => console.log(JSON.stringify({ ...obj, ts: new Date().toISOString() }));

/* ============ DB ============ */

const sbRest = async (table, query) => {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { headers: sbHeaders });
  if (!res.ok) {
    throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`);
  }
  return res.json();
};

/** Notas candidatas: activas, con imagen, últimas 18h, en orden. */
async function notasCandidatas() {
  const desde = new Date(Date.now() - 18 * 3600 * 1000).toISOString();
  const rows = await sbRest(
    "articles",
    `select=id,title,section,image_url,excerpt&active=eq.true&image_url=not.is.null&created_at=gte.${encodeURIComponent(desde)}&order=created_at.desc&limit=60`,
  );
  return rows.filter((r) => (r.image_url ?? "").length > 10);
}

/** article_ids ya usados en reels publicados/pending (últimas 72h). */
async function idsYaUsados() {
  const desde = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
  const rows = await sbRest(
    "social_posts",
    `select=article_ids&kind=eq.reel&status=in.(published,pending)&created_at=gte.${encodeURIComponent(desde)}`,
  );
  const ids = new Set();
  for (const row of rows) for (const id of row.article_ids ?? []) if (id) ids.add(id);
  return ids;
}

/* ============ guion ============ */

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

/** Fecha legible en ART para la intro (la PC está en ART). */
function fechaLegible() {
  const d = new Date();
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
const fechaCorta = () => {
  const d = new Date();
  return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Normaliza un titular para TTS: monedas, porcentajes, símbolos, comillas. */
function ttsNormalize(text) {
  return text
    .replace(/\$\s*(\d+(?:[.,]\d+)?)\s*[mM]\b/g, "$1 millones de pesos")
    .replace(/\$\s*(\d+(?:[.,]\d+)?)\s*[kK]\b/g, "$1 mil pesos")
    .replace(/\$\s*(\d+(?:[.,]\d+)?)/g, "$1 pesos")
    .replace(/(\d+(?:[.,]\d+)?)\s*%/g, "$1 por ciento")
    .replace(/#/g, " ").replace(/@\w+/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/["“”«»„]/g, " ")
    .replace(/[–—]/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;!?])/g, "$1")
    .trim();
}

/** Primera frase del excerpt, recortada limpia. Devuelve "" si es tabla/lista. */
function primeraFrase(excerpt, max = 130) {
  if (!excerpt) return "";
  const frase = excerpt.split(/(?<=[.!?])\s/)[0].replace(/\s{2,}/g, " ").trim();
  // tablas de fichas (árbitros, horarios): mucha puntuación ":" → usar solo titular
  if ((frase.match(/:/g) ?? []).length > 1) return "";
  if (frase.length <= max) return frase;
  const corte = frase.slice(0, max);
  const lastSpace = corte.lastIndexOf(" ");
  return corte.slice(0, lastSpace > 60 ? lastSpace : max);
}

/** Selección: 3-4 notas, sin repetir usadas, alternando secciones. */
function seleccionar(candidatas, usados, cant = 4) {
  const pool = candidatas.filter((r) => !usados.has(r.id));
  const elegidas = [];
  const seccionesVistas = new Set();
  for (const r of pool) {
    if (elegidas.length >= cant) break;
    // alternar secciones: si la sección ya salió y hay opciones nuevas, saltar
    if (seccionesVistas.has(r.section) && pool.length - elegidas.length > cant - elegidas.length + 2) continue;
    elegidas.push(r);
    seccionesVistas.add(r.section);
  }
  if (elegidas.length < Math.min(3, pool.length)) {
    for (const r of pool) {
      if (elegidas.length >= 3) break;
      if (!elegidas.includes(r)) elegidas.push(r);
    }
  }
  return elegidas;
}

/* ============ TTS ============ */

function tts(text, outFile) {
  execFileSync(
    "python",
    ["-m", "edge_tts", "--voice", VOICE, "--rate=+8%", "--text", text, "--write-media", outFile],
    { stdio: "pipe" },
  );
}

function durSegundos(file) {
  const out = execFileSync(
    process.env.FFPROBE ?? "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
    { encoding: "utf-8" },
  );
  return parseFloat(out.trim());
}

/* ============ main ============ */

const main = async () => {
  console.log("=== build-reel start ===");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Selección de notas
  const [candidatas, usados] = await Promise.all([notasCandidatas(), idsYaUsados()]);
  const elegidas = seleccionar(candidatas, usados);
  if (elegidas.length < 1) {
    log({ ok: false, reason: "sin notas nuevas (todo ya usado o sin candidatas)" });
    console.log("=== build-reel end ===");
    return;
  }
  log({ candidatas: candidatas.length, yaUsadas: usados.size, seleccionadas: elegidas.map((e) => `${e.section}: ${e.title.slice(0, 40)}`) });

  // 2. Limpio segmentos viejos
  for (const f of fs.readdirSync(PUBLIC)) {
    if (f.startsWith("seg-") && f.endsWith(".mp3")) fs.unlinkSync(path.join(PUBLIC, f));
  }

  // 3. Guion + TTS por segmento
  const segIntro = "Las noticias del día.";
  const segCierre = "Seguinos en Instagram como quenoticia oka, y leé la nota completa en quenoticia punto com punto ar.";
  tts(segIntro, path.join(PUBLIC, "seg-intro.mp3"));
  const segs = elegidas.map((n, i) => {
    const frase = primeraFrase(n.excerpt);
    const texto = ttsNormalize(frase ? `${n.title}. ${frase}` : `${n.title}.`);
    const file = `seg-${i}.mp3`;
    tts(texto, path.join(PUBLIC, file));
    return { file, texto };
  });
  tts(segCierre, path.join(PUBLIC, "seg-cierre.mp3"));
  log({ guion: { intro: segIntro, notas: segs.map((s) => s.texto), cierre: segCierre } });

  // 4. Duraciones → frames (+0.4s de colchón por segmento)
  const PAD = 0.4;
  const framesOf = (file) => Math.ceil((durSegundos(path.join(PUBLIC, file)) + PAD) * FPS);
  const intro = { audio: "seg-intro.mp3", durFrames: framesOf("seg-intro.mp3") };
  const cierre = { audio: "seg-cierre.mp3", durFrames: framesOf("seg-cierre.mp3") };
  const notas = elegidas.map((n, i) => ({
    chip: n.section.charAt(0).toUpperCase() + n.section.slice(1),
    color: SECTION_COLORS[n.section] ?? "#f97316",
    titular: n.title,
    sub: primeraFrase(n.excerpt, 110),
    layout: i % 2 === 0 ? "fullbleed" : "banda",
    image: n.image_url,
    audio: segs[i].file,
    durFrames: framesOf(segs[i].file),
  }));

  const inputProps = {
    fecha: fechaCorta(),
    musica: "musica.mp3",
    musicVolume: 0.12,
    gapFrames: 9,
    intro,
    notas,
    cierre,
  };
  const propsFile = path.join(OUT_DIR, "inputProps.json");
  fs.writeFileSync(propsFile, JSON.stringify(inputProps, null, 2));
  const durTotal = (intro.durFrames + notas.reduce((a, n) => a + n.durFrames + 9, 0) + cierre.durFrames) / FPS;
  log({ duracionSeg: Math.round(durTotal), propsFile });

  if (dryRun) {
    console.log("=== build-reel end (dry-run) ===");
    return;
  }

  // 5. Render Remotion programático
  const ts = Date.now();
  const outFile = path.join(OUT_DIR, `reel-${ts}.mp4`);
  console.log("bundling...");
  const bundleLocation = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts") });
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "Reel",
    inputProps,
  });
  console.log(`rendering ${composition.durationInFrames} frames → ${path.basename(outFile)}`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outFile,
    inputProps,
  });

  // 6. Caption + manifest para el VPS
  const caption =
    `📰 Las noticias del día · ${fechaCorta()}\n\n` +
    elegidas.map((n, i) => `${i + 1}. ${n.title}`).join("\n") +
    `\n\n👉 Todas las notas: https://www.quenoticia.com.ar`;
  const manifest = {
    ts,
    mp4: path.basename(outFile),
    caption,
    articleIds: elegidas.map((n) => n.id),
    sections: [...new Set(elegidas.map((n) => n.section))],
  };
  const manifestFile = path.join(OUT_DIR, `reel-${ts}.json`);
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  // 7. scp al VPS + trigger
  if (!VPS_HOST) {
    log({ ok: true, warning: "VPS_HOST no configurado — reel quedó en out/" });
    console.log("=== build-reel end ===");
    return;
  }
  console.log("scp → VPS");
  execSync(`scp -P ${VPS_PORT} "${outFile}" "${VPS_HOST}:${INCOMING}/reel-${ts}.mp4"`, { stdio: "inherit" });
  execSync(`scp -P ${VPS_PORT} "${manifestFile}" "${VPS_HOST}:${INCOMING}/reel-${ts}.json"`, { stdio: "inherit" });

  if (noPush) {
    log({ ok: true, warning: "--no-push: service no disparado" });
    console.log("=== build-reel end ===");
    return;
  }
  console.log("trigger quenoticia-reels.service");
  execSync(`ssh -p ${VPS_PORT} ${VPS_HOST} "sudo systemctl start quenoticia-reels.service"`, { stdio: "inherit" });

  log({ ok: true, outFile: path.basename(outFile), duracionSeg: Math.round(durTotal) });
  console.log("=== build-reel end ===");
};

const SECTION_COLORS = {
  politica: "#e63946",
  deportes: "#3b82f6",
  economia: "#10b981",
  internacionales: "#8b5cf6",
  tucuman: "#f59e0b",
  opinion: "#0d9488",
  actualidad: "#f43f5e",
  espectaculos: "#ec4899",
};

main().catch((err) => {
  console.error("build-reel FALLO:", err);
  process.exit(1);
});