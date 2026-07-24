import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import RedesDashboard from "@/components/admin/RedesDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { listChannels } from "@/lib/social/buffer-client";
import { getDailyChannelCounts, DAILY_LIMITS } from "@/lib/social/daily-limits";

export const dynamic = "force-dynamic";

interface SocialPostRow {
  id: string;
  scheduled_at: string;
  published_at: string | null;
  article_ids: (string | null)[];
  sections: string[];
  slide_image_urls: string[];
  caption: string;
  buffer_update_ids: string[] | null;
  channel_targets: { channelId: string; service: string; postId: string | null; error: string | null }[] | null;
  status: "pending" | "published" | "failed" | "skipped";
  kind: "nota" | "evento";
  error_message: string | null;
  created_at: string;
}

export interface ArticleOption {
  id: string;
  title: string;
  section: string;
  created_at: string;
}

export interface EventOption {
  id: string;
  title: string;
  category: string;
  date_iso: string | null;
  venue_name: string | null;
  created_at: string;
}

export interface ChannelOption {
  id: string;
  service: string;
  name: string;
  usedToday: number;
  limit: number;
  remaining: number;
}

export default async function AdminRedesPage() {
  const { user } = await requireAdmin();
  const admin = await getSupabaseAdmin();

  const { data } = await admin
    .from("social_posts")
    .select(
      "id, scheduled_at, published_at, article_ids, sections, slide_image_urls, caption, buffer_update_ids, channel_targets, status, kind, error_message, created_at",
    )
    .order("scheduled_at", { ascending: false })
    .limit(30);

  const posts = (data ?? []) as SocialPostRow[];

  // Notas recientes (últimos 2 días, máximo 200) agrupadas para el picker.
  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data: articlesData } = await admin
    .from("articles")
    .select("id, title, section, created_at")
    .eq("active", true)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  const articles = (articlesData ?? []) as ArticleOption[];

  // Eventos de agenda activos (próximos 30 días desde hoy, máximo 150)
  const today = new Date().toISOString().slice(0, 10);
  const { data: eventsData } = await admin
    .from("events")
    .select("id, title, category, date_iso, venue_name, created_at")
    .eq("active", true)
    .gte("date_iso", today)
    .order("date_iso", { ascending: true })
    .limit(150);
  const events = (eventsData ?? []) as EventOption[];

  // Canales de Buffer con conteos diarios
  let channels: ChannelOption[] = [];
  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  if (bufferKey) {
    try {
      const bufChannels = await listChannels(bufferKey);
      const counts = await getDailyChannelCounts();
      channels = bufChannels.map((c) => {
        const used = counts.get(c.id) ?? 0;
        const limit = DAILY_LIMITS[c.service] ?? 6;
        return {
          id: c.id,
          service: c.service,
          name: c.name,
          usedToday: used,
          limit,
          remaining: Math.max(0, limit - used),
        };
      });
    } catch (err) {
      console.error("redes page listChannels:", err);
    }
  }

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <RedesDashboard
        posts={posts.map((p) => ({
          ...p,
          scheduled_at: p.scheduled_at,
          published_at: p.published_at,
          created_at: p.created_at,
        }))}
        articles={articles}
        events={events}
        channels={channels}
        config={{
          bufferKeyConfigured: Boolean(process.env.BUFFER_API_KEY),
          channelIdsCount: (process.env.BUFFER_CHANNEL_IDS ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean).length,
          cronSecretConfigured: Boolean(process.env.CRON_SECRET),
        }}
      />
    </AdminSiteLayout>
  );
}