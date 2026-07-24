import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Límites diarios por servicio (platform-side, para evitar ban). */
export const DAILY_LIMITS: Record<string, number> = {
  instagram: 6,
  facebook: 6,
  tiktok: 3,
  // Defaults conservadores para servicios no listados
  twitter: 6,
  threads: 6,
  bluesky: 6,
  linkedin: 6,
  pinterest: 6,
  youtube: 6,
  mastodon: 6,
  google: 6,
};

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
 *  Considera sólo posts con status='published' o 'pending' (scheduled).
 *  No cuenta los 'failed' ni 'skipped'. */
export async function getDailyChannelCounts(): Promise<Map<string, number>> {
  const admin = await getSupabaseAdmin();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data } = await admin
    .from("social_posts")
    .select("channel_targets, status")
    .in("status", ["published", "pending"])
    .gte("scheduled_at", startOfDay.toISOString());

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

/** Dado un channelId y su service, devuelve si se puede publicar (no se pasó del límite). */
export function canPublishToChannel(
  channelId: string,
  service: string,
  dailyCounts: Map<string, number>,
): { allowed: boolean; reason?: string; remaining: number } {
  const count = dailyCounts.get(channelId) ?? 0;
  const limit = DAILY_LIMITS[service] ?? 6;
  const remaining = limit - count;
  if (count >= limit) {
    return {
      allowed: false,
      reason: `${service} ya publicó ${count}/${limit} hoy — límite diario alcanzado`,
      remaining: 0,
    };
  }
  return { allowed: true, remaining };
}