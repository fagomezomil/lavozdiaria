import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Límites diarios por servicio (platform-side, para evitar ban).
 *  Feed = publicaciones al feed (carrusel, publishArticle, publishEvent, agenda).
 *  9 = carrusel 2 + agenda 2 + separador 3 + margen 2 (2026-09-12, con agenda al feed). */
export const DAILY_LIMITS: Record<string, number> = {
  instagram: 9,
  facebook: 9,
  tiktok: 3,
  twitter: 6,
  threads: 6,
  bluesky: 6,
  linkedin: 6,
  pinterest: 6,
  youtube: 6,
  mastodon: 6,
  google: 6,
};

/** Alias para feed (mantener DAILY_LIMITS como alias por compat con callers existentes). */
export const DAILY_LIMITS_FEED = DAILY_LIMITS;

/** Límites diarios para stories (quota aparte en Buffer).
 *  60 = turnos 15/21 (2×10) + agenda + placas de partidos, con margen
 *  (2026-09-12: el límite viejo de 25 bloqueó las placas de partidos un sábado). */
export const DAILY_LIMITS_STORIES: Record<string, number> = {
  instagram: 60,
  facebook: 60,
  // TikTok no soporta stories, se saltea
};

export type PublishKind = "feed" | "stories";

export interface ChannelTarget {
  channelId: string;
  service: string;
  postId: string | null;
  error: string | null;
}

export interface DailyCount {
  channelId: string;
  service: string;
  count: number;
  limit: number;
  remaining: number;
}

/** Cuenta cuántos posts se mandaron a cada canal hoy (desde 00:00 UTC del día actual).
 *  - kind="feed" (default): cuenta rows con kind != 'stories'. Las rows de agenda
 *    (kind='evento') comparten stories + carrusel feed → 1 row cuenta 1 post feed.
 *  - kind="stories": cuenta rows con kind='stories'.
 *  Considera sólo posts con status='published' o 'pending' (scheduled).
 *  No cuenta los 'failed' ni 'skipped'. */
export async function getDailyChannelCounts(
  kind: PublishKind = "feed",
): Promise<Map<string, number>> {
  const admin = await getSupabaseAdmin();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  let query = admin
    .from("social_posts")
    .select("channel_targets, status, kind")
    .in("status", ["published", "pending"])
    .gte("scheduled_at", startOfDay.toISOString());

  if (kind === "stories") {
    query = query.eq("kind", "stories");
  } else {
    // Feed: nota, evento, carrusel (todos los kind que NO sean stories)
    query = query.neq("kind", "stories");
  }

  const { data } = await query;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const targets = (row.channel_targets as ChannelTarget[] | null) ?? [];
    for (const t of targets) {
      if (!t.channelId) continue;
      counts.set(t.channelId, (counts.get(t.channelId) ?? 0) + 1);
    }
  }

  return counts;
}

/** Dado un channelId, su service y el kind, devuelve si se puede publicar. */
export function canPublishToChannel(
  channelId: string,
  service: string,
  dailyCounts: Map<string, number>,
  kind: PublishKind = "feed",
): { allowed: boolean; reason?: string; remaining: number } {
  const count = dailyCounts.get(channelId) ?? 0;
  const limit =
    kind === "stories"
      ? (DAILY_LIMITS_STORIES[service] ?? 25)
      : (DAILY_LIMITS[service] ?? 6);
  const remaining = limit - count;
  if (count >= limit) {
    return {
      allowed: false,
      reason: `${service} ya publicó ${count}/${limit} (${kind}) hoy — límite diario alcanzado`,
      remaining: 0,
    };
  }
  return { allowed: true, remaining };
}