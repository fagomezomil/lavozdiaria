/** Orquestador de las placas de resultados de partidos (roadmap ítem 5).
 *
 *  Corre cada 15 min en franja de partidos (cron-partido.sh → systemd oneshot
 *  quenoticia-partido.service). El wrapper del cron refresca resultados con
 *  futbol.py ANTES de disparar el builder, así que acá solo se consulta DB:
 *
 *  1. Query sports_matches: status=played, últimos 3 días, con score,
 *     equipos tracked (por nombre, DB puede tener aliases sin tilde).
 *  2. Dedupe por match_id en social_posts (published/pending → skip; failed → retry).
 *  3. Render story 9:16 (+ feed 4:5 si es tucumano) → R2 → Buffer.
 *
 *  Dos tiers de publicación:
 *  - Tucumanos (Atlético/San Martín Tucumán): stories + feed 4:5 (+10min).
 *    kind="partido" → cuenta en la grid de IG (GRID_KINDS en build-separador).
 *  - Grandes (River/Boca/Racing/Independiente/Vélez): solo stories.
 *    kind="partido-story" → no ocupa grid.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bufferPublishStories, bufferPublish } from "@/lib/social/buffer-client";
import { r2Upload } from "@/lib/r2";
import { artToday } from "@/lib/sports-utils";
import { teamLogo } from "@/lib/team-logos";
import {
  generarPlacasPartidoStory,
  generarPlacasPartidoFeed,
  type PartidoPlacaSrc,
} from "@/lib/social/partido-placas";
import type { ChannelTarget } from "@/lib/social/daily-limits";

export const TUCUMANOS = ["Atlético Tucumán", "San Martín Tucumán"];
export const GRANDES = ["River Plate", "Boca Juniors", "Racing Club", "Independiente", "Vélez Sarsfield"];
export const TRACKED_TEAMS = [...TUCUMANOS, ...GRANDES];

/** Máximo de partidos publicados por run (el resto queda para el próximo, 15 min). */
const MAX_POSTS_PER_RUN = 3;
const FEED_OFFSET_MIN = 10;

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export interface PartidoPublicado {
  matchId: string;
  partido: string;
  kind: "partido" | "partido-story";
  storyUrl: string;
  feedUrl: string | null;
}

export interface PartidoResult {
  triggered: boolean;
  status: "published" | "failed" | "pending" | "skipped";
  publicados: PartidoPublicado[];
  /** Partidos jugados tracked que quedan sin publicar (backlog). */
  pendientes: number;
  error: string | null;
}

interface PartidoRow {
  match_id: string;
  tournament: string;
  match_date: string;
  time: string | null;
  stadium: string | null;
  city: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
}

/** "2026-09-06" → "Dom 06 Sep". */
function fechaCorta(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${DIAS[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, "0")} ${MESES[d.getUTCMonth()]}`;
}

/** match_id de los partidos ya publicados o pendientes (failed permite retry). */
async function matchIdsYaPublicados(admin: Awaited<ReturnType<typeof getSupabaseAdmin>>): Promise<Set<string>> {
  const { data, error } = await admin
    .from("social_posts")
    .select("article_ids")
    .in("kind", ["partido", "partido-story"])
    .in("status", ["published", "pending"]);
  if (error) {
    console.error("buildPartido matchIdsYaPublicados error:", error);
    return new Set();
  }
  const ids = new Set<string>();
  for (const row of (data as Array<{ article_ids: (string | null)[] }> | null) ?? []) {
    for (const id of row.article_ids ?? []) {
      if (id) ids.add(id);
    }
  }
  return ids;
}

function captionPartido(p: PartidoPlacaSrc): string {
  const jugoTucumano = TUCUMANOS.includes(p.home) || TUCUMANOS.includes(p.away);
  const ganoTucumano =
    (TUCUMANOS.includes(p.home) && p.homeScore > p.awayScore) ||
    (TUCUMANOS.includes(p.away) && p.awayScore > p.homeScore);
  const marcador = `${p.home} ${p.homeScore} - ${p.awayScore} ${p.away}`;
  const titulo = ganoTucumano ? "⚽ ¡GANARON LOS TUCUMANOS!" : jugoTucumano ? "⚽ FINAL:" : "⚽ FINAL:";
  return `${titulo}\n${marcador}\n${p.torneo} · ${p.fecha}\n\n📅 Todo el fixture: quenoticia.com.ar/deportes/futbol`;
}

/** Orquesta: query partidos jugados → dedupe → render → R2 → Buffer → social_posts. */
export async function buildPartido(
  bufferKey?: string,
  channelIds?: string[],
): Promise<PartidoResult> {
  const admin = await getSupabaseAdmin();

  // Últimos 3 días en ART (cubre fin de semana completo sin backfills viejos).
  const desde = new Date(
    new Date(`${artToday()}T12:00:00Z`).getTime() - 3 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .split("T")[0];

  const { data: rows, error } = await admin
    .from("sports_matches")
    .select(
      "match_id, tournament, match_date, time, stadium, city, home_team, away_team, home_score, away_score",
    )
    .eq("status", "played")
    .gte("match_date", desde)
    .not("home_score", "is", null)
    .not("away_score", "is", null)
    .order("kickoff_at", { ascending: true, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error("buildPartido query error:", error);
    return { triggered: false, status: "failed", publicados: [], pendientes: 0, error: error.message };
  }

  const tracked = ((rows ?? []) as unknown as PartidoRow[]).filter(
    (m) => TRACKED_TEAMS.includes(m.home_team) || TRACKED_TEAMS.includes(m.away_team),
  );

  const publicados = await matchIdsYaPublicados(admin);
  const pendientes = tracked.filter((m) => !publicados.has(m.match_id));

  if (pendientes.length === 0) {
    console.log(
      `buildPartido: ${tracked.length} jugados tracked, 0 nuevos — no-op (desde ${desde})`,
    );
    return { triggered: false, status: "skipped", publicados: [], pendientes: 0, error: null };
  }

  console.log(
    `buildPartido: ${pendientes.length} nuevos (de ${tracked.length} tracked) — proceso hasta ${MAX_POSTS_PER_RUN}`,
  );

  const aProcesar = pendientes.slice(0, MAX_POSTS_PER_RUN);
  const resultados: PartidoPublicado[] = [];
  let status: PartidoResult["status"] = "published";
  let errorMsg: string | null = null;

  for (let i = 0; i < aProcesar.length; i++) {
    const m = aProcesar[i];
    const tucumano = TUCUMANOS.includes(m.home_team) || TUCUMANOS.includes(m.away_team);
    const kind: "partido" | "partido-story" = tucumano ? "partido" : "partido-story";
    const marcador = `${m.home_team} ${m.home_score} - ${m.away_score} ${m.away_team}`;

    try {
      const escudoHome = teamLogo(m.home_team);
      const escudoAway = teamLogo(m.away_team);
      if (!escudoHome || !escudoAway) {
        throw new Error(
          `sin escudo: ${!escudoHome ? m.home_team : m.away_team} (match ${m.match_id})`,
        );
      }

      const hora = m.time ? m.time.slice(0, 5) : "";
      const src: PartidoPlacaSrc = {
        slug: m.match_id,
        torneo: m.tournament,
        fecha: fechaCorta(m.match_date),
        hora,
        estadio: m.stadium ?? "",
        ciudad: m.city ?? "",
        home: m.home_team,
        away: m.away_team,
        homeScore: m.home_score as number,
        awayScore: m.away_score as number,
        escudoHomeUrl: escudoHome,
        escudoAwayUrl: escudoAway,
      };

      // Render → R2
      const ts = Date.now();
      const [placaStory] = await generarPlacasPartidoStory([src]);
      const storyPath = `social/partido-${ts}-${m.match_id}-story.png`;
      const storyUrl = await r2Upload("media", storyPath, placaStory.png, "image/png");
      if (!storyUrl) throw new Error(`upload R2 falló: ${storyPath}`);

      let feedUrl: string | null = null;
      if (tucumano) {
        const [placaFeed] = await generarPlacasPartidoFeed([src]);
        const feedPath = `social/partido-${ts}-${m.match_id}-feed.png`;
        feedUrl = await r2Upload("media", feedPath, placaFeed.png, "image/png");
        if (!feedUrl) throw new Error(`upload R2 falló: ${feedPath}`);
      }

      // Buffer: stories siempre; feed solo tucumanos (staggered por índice).
      const caption = captionPartido(src);
      let channelTargets: ChannelTarget[] = [];
      let bufferUpdateIds: string[] = [];
      let rowStatus: "published" | "failed" | "pending" = "pending";
      let rowError: string | null = null;
      let scheduledAt = new Date().toISOString();

      if (bufferKey && bufferKey.length > 0 && (channelIds ?? []).length > 0) {
        const stories = await bufferPublishStories(bufferKey, channelIds ?? [], [
          { url: storyUrl, caption },
        ]);
        const storyIds = (stories.channelTargets ?? [])
          .map((t) => t.postId)
          .filter((id): id is string => id !== null);

        const errores: string[] = [];
        if (!stories.success) errores.push(`stories: ${stories.error ?? "falló"}`);

        if (tucumano && feedUrl) {
          const feedScheduled = new Date(Date.now() + FEED_OFFSET_MIN * 60 * 1000 * (i + 1));
          scheduledAt = feedScheduled.toISOString();
          const feed = await bufferPublish(bufferKey, channelIds ?? [], caption, [feedUrl], feedScheduled);
          channelTargets = feed.channelTargets ?? [];
          if (!feed.success) errores.push(`feed: ${feed.error ?? "falló"}`);
        } else {
          channelTargets = stories.channelTargets ?? [];
        }

        bufferUpdateIds = [
          ...new Set([
            ...storyIds,
            ...(channelTargets ?? []).map((t) => t.postId).filter((id): id is string => id !== null),
          ]),
        ];

        rowStatus = stories.success ? "published" : "failed";
        rowError = errores.length > 0 ? errores.join(" | ") : null;
      } else {
        rowError = "BUFFER_API_KEY/CHANNEL_IDS missing — guardado como pending";
      }

      const { error: errSave } = await admin.from("social_posts").insert({
        status: rowStatus,
        kind,
        article_ids: [m.match_id],
        sections: ["deportes"],
        slide_image_urls: feedUrl ? [storyUrl, feedUrl] : [storyUrl],
        caption,
        channel_targets: channelTargets,
        buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
        error_message: rowError,
        scheduled_at: scheduledAt,
        published_at: rowStatus === "published" ? new Date().toISOString() : null,
      });
      if (errSave) console.error("buildPartido save error:", errSave);

      resultados.push({ matchId: m.match_id, partido: marcador, kind, storyUrl, feedUrl });
      console.log(`buildPartido: ${marcador} → ${kind} ${rowStatus}`);

      if (rowStatus === "failed" && status === "published") status = "failed";
    } catch (err) {
      console.error(`buildPartido: ${marcador} falló:`, err);
      const { error: errSave } = await admin.from("social_posts").insert({
        status: "failed",
        kind,
        article_ids: [m.match_id],
        sections: ["deportes"],
        slide_image_urls: [],
        caption: null,
        channel_targets: [],
        buffer_update_ids: null,
        error_message: String(err),
        published_at: null,
      });
      if (errSave) console.error("buildPartido save error:", errSave);
      status = "failed";
      errorMsg = String(err);
    }
  }

  return {
    triggered: true,
    status,
    publicados: resultados,
    pendientes: pendientes.length - aProcesar.length,
    error: errorMsg,
  };
}