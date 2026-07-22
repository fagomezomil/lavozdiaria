import { createClient } from "@/lib/supabase/server";

/** Aggregations for the admin stats dashboard. */

const DOMAINS: Record<string, string> = {
  "contextotucuman.com": "Contexto",
  "comunicaciontucuman.gob.ar": "Comunicación",
  "tycsports.com": "TyC Sports",
};

const REPLICATED_DOMAINS: Record<string, string> = {
  "tn.com.ar": "TN",
  "clarin.com": "Clarín",
  "lanacion.com.ar": "La Nación",
  "infobae.com": "Infobae",
  "telam.com.ar": "Télam",
  "elliberal.com.ar": "El Liberal",
  "losprimerostucuman.com": "Los Primeros",
  "pagina12.com.ar": "Página/12",
  "lagaceta.com.ar": "La Gaceta",
};

function classifySource(url: string): string {
  for (const dom of Object.keys(DOMAINS)) {
    if (url.includes(dom)) return DOMAINS[dom];
  }
  return "Replicadas";
}

/** Same as classifySource but breaks down "Replicadas" by upstream medium. */
function classifySourceDetailed(url: string): string {
  for (const dom of Object.keys(DOMAINS)) {
    if (url.includes(dom)) return DOMAINS[dom];
  }
  for (const dom of Object.keys(REPLICATED_DOMAINS)) {
    if (url.includes(dom)) return REPLICATED_DOMAINS[dom];
  }
  return "Otros";
}

export interface StatsTotals {
  articles: number;
  comments: number;
  ads: number;
  sponsored: number;
  clients: number;
  users: number;
}

export interface SectionCount {
  section: string;
  count: number;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface MonthCount {
  month: string; // YYYY-MM
  count: number;
}

export async function getStatsTotals(): Promise<StatsTotals> {
  const supabase = await createClient();
  const [articles, comments, ads, sponsored, clients, users] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("ads").select("id", { count: "exact", head: true }),
    supabase.from("sponsored_contents").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  return {
    articles: articles.count ?? 0,
    comments: comments.count ?? 0,
    ads: ads.count ?? 0,
    sponsored: sponsored.count ?? 0,
    clients: clients.count ?? 0,
    users: users.count ?? 0,
  };
}

export async function getArticlesBySection(): Promise<SectionCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("section");
  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    const sec = (row.section as string) || "(sin sección)";
    counts[sec] = (counts[sec] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => b.count - a.count);
}

export interface SourceBreakdown {
  aggregated: SourceCount[]; // 4 buckets (Contexto, Comunicación, TyC, Replicadas)
  detailed: SourceCount[]; // Replicadas split by upstream medium
}

export async function getArticlesBySource(): Promise<SourceBreakdown> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("original_url");
  if (error || !data) return { aggregated: [], detailed: [] };

  const agg: Record<string, number> = {};
  const det: Record<string, number> = {};
  for (const row of data) {
    const url = (row.original_url as string) || "";
    const a = classifySource(url);
    agg[a] = (agg[a] || 0) + 1;
    const d = classifySourceDetailed(url);
    det[d] = (det[d] || 0) + 1;
  }
  const toArr = (counts: Record<string, number>) =>
    Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  return { aggregated: toArr(agg), detailed: toArr(det) };
}

/** Raw creation timestamps — the client aggregates by day/week/month. */
export async function getArticleTimestamps(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("created_at");
  if (error || !data) return [];
  return (data as { created_at: string | null }[])
    .map((r) => r.created_at)
    .filter((ts): ts is string => Boolean(ts));
}