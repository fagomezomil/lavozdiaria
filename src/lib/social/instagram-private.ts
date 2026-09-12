/** Wrapper del script Python stories_ig.py (instagrapi, API privada de IG).
 *
 *  IG no permite publicar link stickers por la API oficial de Meta
 *  ("Publishing stickers (i.e., link, poll, location) is not supported").
 *  Esto publica stories con link tappable usando la SESIÓN cacheada en el
 *  VPS (bootstrap en la PC de Fede con ig_login.py — nunca password login
 *  desde la IP del VPS).
 *
 *  Contrato con el caller (builders):
 *  - Si no está configurado (env ausente / no-VPS) o la sesión está muerta →
 *    devuelve fallback: true y el caller publica por Buffer (sin sticker).
 *  - El script NO hace retry contra challenges (reintentar acelera el ban).
 */

import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface IgStorySlide {
  url: string;
  link: string;
  caption?: string;
}

export interface IgStoriesResult {
  ok: boolean;
  published: number;
  total: number;
  errors: string[];
  /** Índices (del manifest) de slides NO publicados en IG — el caller
   *  re-publica solo esos por Buffer para no duplicar los subidos. */
  failedIndexes?: number[];
  /** true = sesión inválida / no configurado → caller DEBE caer a Buffer. */
  fallback: boolean;
}

const PYTHON = process.env.STORIES_IG_PYTHON ?? "/opt/scraper/.venv/bin/python";
const SCRIPT = process.env.STORIES_IG_SCRIPT ?? "/opt/scraper/stories_ig.py";
/** ~8s delay entre stories + render/descarga. 11 slides → holgado. */
const TIMEOUT_MS = 240_000;

export function igStoriesConfigured(): boolean {
  return process.env.STORIES_IG_ENABLED === "1";
}

function runPython(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      PYTHON,
      [SCRIPT, ...args],
      { timeout: TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => {
        // timeout de execFile mata el proceso y devuelve err con signal SIGTERM.
        const e = err as (NodeJS.ErrnoException & { killed?: boolean; code?: number }) | null;
        const code = e?.killed ? 124 : (e?.code ?? 0);
        resolve({ code: typeof code === "number" ? code : 0, stdout: stdout ?? "", stderr: stderr ?? "" });
      },
    );
  });
}

/** Publica stories IG con link sticker vía stories_ig.py.
 *  fallback:true = nada llegó a IG, el caller repite TODO por Buffer.
 *  ok:false con failedIndexes = parcial: el caller repite SOLO esas slides. */
export async function publishStoriesViaInstagrapi(slides: IgStorySlide[]): Promise<IgStoriesResult> {
  if (!igStoriesConfigured()) {
    return { ok: false, published: 0, total: slides.length, errors: ["no configurado (STORIES_IG_ENABLED!=1)"], fallback: true };
  }
  if (slides.length === 0) {
    return { ok: true, published: 0, total: 0, errors: [], fallback: false };
  }

  const manifestPath = join(tmpdir(), `stories-ig-${Date.now()}.json`);
  let res: { code: number; stdout: string; stderr: string };
  try {
    await writeFile(manifestPath, JSON.stringify(slides), "utf-8");
    res = await runPython(["-"]);
  } catch (err) {
    return { ok: false, published: 0, total: slides.length, errors: [`manifest/spawn: ${String(err)}`], fallback: true };
  } finally {
    await unlink(manifestPath).catch(() => {});
  }

  // Última línea de stdout = JSON del script (los logs van a stderr).
  const lines = res.stdout.trim().split("\n").filter((l) => l.trim().startsWith("{"));
  let parsed: IgStoriesResult | null = null;
  if (lines.length > 0) {
    try {
      parsed = JSON.parse(lines[lines.length - 1]) as IgStoriesResult;
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    const tail = res.stderr.split("\n").slice(-3).join(" | ");
    return {
      ok: false,
      published: 0,
      total: slides.length,
      errors: [`sin JSON del script (exit ${res.code}): ${tail}`],
      fallback: true,
    };
  }

  if (res.code === 1) {
    // Sesión inválida / challenge → fallback completo a Buffer.
    return { ...parsed, ok: false, fallback: true };
  }
  // exit 0 = todo ok; exit 2 = parcial. Parcial: lo publicado ya está en IG;
  // el caller refinaliza solo las que faltan (no re-publica las subidas).
  return { ...parsed, fallback: false };
}