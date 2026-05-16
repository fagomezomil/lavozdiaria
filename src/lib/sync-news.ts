import { createClient } from "@supabase/supabase-js";
import { Section, sectionConfig } from "./types";

const API_BASE = "https://api.freenewsapi.io/v1";
const API_KEY = process.env.FREENEWS_API_KEY ?? "";

const SECTION_TOPIC_MAP: Record<Section, string> = {
  politica: "politics",
  deportes: "sports",
  economia: "business",
  internacionales: "world",
  tucuman: "tucuman",
};

// --- API response types ---

interface NewsListItem {
  uuid: string;
  title: string;
  published_at: string;
  publisher: string;
}

interface NewsListResponse {
  data: NewsListItem[];
  meta: { page_size: number; returned: number; has_more: boolean };
}

interface ArticleDetailData {
  uuid: string;
  title: string;
  thumbnail: string;
  publisher: string;
  authors: string[];
  topics: string[];
  published_at: string;
  original_url: string;
  incipit: string;
  body: string;
}

interface ArticleDetailResponse {
  data: ArticleDetailData;
}

// --- Helpers ---

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateExcerpt(incipit: string, body: string): string {
  if (incipit) {
    const plain = incipit.replace(/<[^>]*>/g, "").trim();
    return plain.length > 200 ? plain.slice(0, 197) + "..." : plain;
  }
  const plain = body.replace(/<[^>]*>/g, "").trim();
  return plain.length > 200 ? plain.slice(0, 197) + "..." : plain;
}

function inferSection(topics: string[]): Section {
  const TOPIC_MAP: Record<string, Section> = {
    politics: "politica",
    sports: "deportes",
    rugby: "deportes",
    football: "deportes",
    soccer: "deportes",
    business: "economia",
    economy: "economia",
    finance: "economia",
    world: "internacionales",
    society: "internacionales",
    entertainment: "internacionales",
    health: "internacionales",
    science: "internacionales",
    technology: "internacionales",
  };

  for (const topic of topics) {
    const key = topic.toLowerCase();
    for (const [mapKey, section] of Object.entries(TOPIC_MAP)) {
      if (key.includes(mapKey)) return section;
    }
  }
  return "internacionales";
}

// --- Sync logic ---

interface CachedArticleRow {
  id: string;
  section: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  publisher: string;
  date: string;
  image_url: string | null;
  image_alt: string;
  excerpt: string;
  body: string | null;
  original_url: string | null;
  featured: boolean;
  breaking: boolean;
  cached_at: string;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

async function fetchFromApi<T>(path: string): Promise<T | null> {
  if (!API_KEY) {
    console.error("[sync] FREENEWS_API_KEY is not set");
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-api-key": API_KEY },
    });
    if (!res.ok) {
      console.error(`[sync] API error ${res.status} for ${path}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[sync] Fetch failed for ${path}:`, err);
    return null;
  }
}

async function syncSection(section: Section): Promise<number> {
  const topic = SECTION_TOPIC_MAP[section];
  const url =
    section === "tucuman"
      ? `/news?country=ar&language=es&in_body=Tucum%C3%A1n&page_size=12`
      : `/news?country=ar&language=es&topic=${topic}&page_size=12`;

  const listData = await fetchFromApi<NewsListResponse>(url);
  if (!listData?.data?.length) {
    console.warn(`[sync] No articles returned for section ${section}`);
    return 0;
  }
  console.log(`[sync] Section ${section}: got ${listData.data.length} articles from list API`);

  // Store basic info from list — details are backfilled on-demand
  const rows: CachedArticleRow[] = listData.data.map((item) => ({
    id: item.uuid,
    section,
    title: item.title,
    subtitle: null,
    author: null,
    publisher: item.publisher,
    date: formatDate(item.published_at),
    image_url: null,
    image_alt: item.title,
    excerpt: "",
    body: null,
    original_url: null,
    featured: false,
    breaking: false,
    cached_at: new Date().toISOString(),
  }));

  // Upsert into Supabase
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("cached_articles").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    console.error(`[sync] Error upserting section ${section}:`, error);
  }

  return rows.length;
}

export async function syncAllSections(): Promise<{ synced: number; errors: string[] }> {
  const sections = Object.keys(sectionConfig) as Section[];
  const errors: string[] = [];
  let totalSynced = 0;

  for (const section of sections) {
    try {
      const count = await syncSection(section);
      console.log(`Synced ${count} articles for section ${section}`);
      totalSynced += count;
    } catch (err) {
      console.error(`Failed to sync section ${section}:`, err);
      errors.push(`${section}: ${String(err)}`);
    }
  }

  // Delete stale articles (older than 24 hours)
  const supabase = getSupabaseAdmin();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error: deleteError } = await supabase
    .from("cached_articles")
    .delete()
    .lt("cached_at", yesterday);

  if (deleteError) {
    errors.push(`Cleanup: ${deleteError.message}`);
  }

  return { synced: totalSynced, errors };
}

// --- Backfill details for incomplete cached articles ---

export async function backfillDetails(): Promise<{ backfilled: number; errors: string[] }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cached_articles")
    .select("id")
    .is("body", null);

  if (error || !data?.length) {
    return { backfilled: 0, errors: error ? [error.message] : [] };
  }

  const errors: string[] = [];
  let backfilled = 0;

  // Process in batches of 4
  for (let i = 0; i < data.length; i += 4) {
    const batch = data.slice(i, i + 4);
    const results = await Promise.all(
      batch.map(async (row) => {
        try {
          await backfillArticle({ id: row.id } as Record<string, unknown>);
          return true;
        } catch {
          return false;
        }
      })
    );
    backfilled += results.filter(Boolean).length;

    // Delay between batches
    if (i + 4 < data.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { backfilled, errors };
}

// --- Read cached articles (used by api.ts) ---

export interface CachedArticle {
  id: string;
  title: string;
  subtitle?: string;
  section: Section;
  author?: string;
  publisher: string;
  date: string;
  imageUrl?: string;
  imageAlt: string;
  excerpt: string;
  body?: string;
  originalUrl?: string;
  featured: boolean;
  breaking: boolean;
}

// Backfill missing details for articles (fire-and-forget cache update)
async function backfillArticle(row: Record<string, unknown>): Promise<void> {
  const uuid = row.id as string;
  const detail = await fetchFromApi<ArticleDetailResponse>(`/details?uuid=${uuid}`);
  if (!detail) return;

  const d = detail.data;
  const adminClient = getSupabaseAdmin();
  const { error } = await adminClient.from("cached_articles").update({
    title: d.title,
    author: d.authors?.length ? d.authors[0] : null,
    publisher: d.publisher,
    date: formatDate(d.published_at),
    image_url: d.thumbnail || null,
    excerpt: generateExcerpt(d.incipit, d.body),
    body: d.body || null,
    original_url: d.original_url || null,
  }).eq("id", uuid);

  if (error) {
    console.error(`[backfill] Error updating ${uuid}:`, error);
  } else {
    console.log(`[backfill] Updated detail for ${uuid}`);
  }
}

export async function getCachedArticles(section: Section): Promise<Article[]> {
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cached_articles")
    .select("*")
    .eq("section", section)
    .order("cached_at", { ascending: false });

  if (error || !data?.length) return [];

  // Backfill articles missing details (in parallel, fire-and-forget)
  const incomplete = (data as Record<string, unknown>[]).filter(
    (row) => !row.image_url && !row.body
  );
  if (incomplete.length > 0) {
    // Backfill up to 4 at a time to avoid overwhelming the API
    const backfillBatch = incomplete.slice(0, 4);
    Promise.all(backfillBatch.map(backfillArticle)).catch(() => {});
    // Queue remaining backfills with a delay
    if (incomplete.length > 4) {
      setTimeout(async () => {
        const rest = incomplete.slice(4);
        for (let i = 0; i < rest.length; i += 4) {
          const batch = rest.slice(i, i + 4);
          await Promise.all(batch.map(backfillArticle));
          if (i + 4 < rest.length) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }, 2000);
    }
  }

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    section: row.section as Section,
    author: (row.author as string) || undefined,
    publisher: row.publisher as string,
    date: row.date as string,
    imageUrl: (row.image_url as string) || undefined,
    imageAlt: (row.image_alt as string) || "",
    excerpt: (row.excerpt as string) || "",
    body: (row.body as string) || undefined,
    originalUrl: (row.original_url as string) || undefined,
    featured: (row.featured as boolean) ?? false,
    breaking: (row.breaking as boolean) ?? false,
  }));
}

export async function getCachedArticleDetail(uuid: string): Promise<Article | null> {
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cached_articles")
    .select("*")
    .eq("id", uuid)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const article: Article = {
    id: row.id as string,
    title: row.title as string,
    section: row.section as Section,
    author: (row.author as string) || undefined,
    publisher: row.publisher as string,
    date: row.date as string,
    imageUrl: (row.image_url as string) || undefined,
    imageAlt: (row.image_alt as string) || "",
    excerpt: (row.excerpt as string) || "",
    body: (row.body as string) || undefined,
    originalUrl: (row.original_url as string) || undefined,
    featured: (row.featured as boolean) ?? false,
    breaking: (row.breaking as boolean) ?? false,
  };

  // If article is incomplete (no body/image), fetch detail from API and update cache
  if (!article.body && !article.imageUrl) {
    const detail = await fetchFromApi<ArticleDetailResponse>(`/details?uuid=${uuid}`);
    if (detail) {
      const d = detail.data;
      article.author = d.authors?.length ? d.authors[0] : undefined;
      article.publisher = d.publisher;
      article.date = formatDate(d.published_at);
      article.imageUrl = d.thumbnail || undefined;
      article.excerpt = generateExcerpt(d.incipit, d.body);
      article.body = d.body || undefined;
      article.originalUrl = d.original_url || undefined;

      // Update cache in background
      const adminClient = getSupabaseAdmin();
      adminClient.from("cached_articles").update({
        title: d.title,
        author: article.author,
        publisher: d.publisher,
        date: formatDate(d.published_at),
        image_url: d.thumbnail || null,
        excerpt: generateExcerpt(d.incipit, d.body),
        body: d.body || null,
        original_url: d.original_url || null,
      }).eq("id", uuid).then(() => {
        console.log(`[sync] Backfilled detail for article ${uuid}`);
      });
    }
  }

  return article;
}

export async function getCachedBreakingNews(): Promise<Article[] | null> {
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cached_articles")
    .select("*")
    .eq("breaking", true)
    .order("cached_at", { ascending: false })
    .limit(5);

  if (error || !data?.length) return null;

  // Backfill incomplete breaking news
  const incomplete = (data as Record<string, unknown>[]).filter(
    (row) => !row.image_url && !row.body
  );
  if (incomplete.length > 0) {
    Promise.all(incomplete.slice(0, 3).map(backfillArticle)).catch(() => {});
  }

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    section: row.section as Section,
    author: (row.author as string) || undefined,
    publisher: row.publisher as string,
    date: row.date as string,
    imageUrl: (row.image_url as string) || undefined,
    imageAlt: (row.image_alt as string) || "",
    excerpt: (row.excerpt as string) || "",
    body: (row.body as string) || undefined,
    originalUrl: (row.original_url as string) || undefined,
    featured: (row.featured as boolean) ?? false,
    breaking: true,
  }));
}

// Need to import Article type
import type { Article } from "./types";