import { Section, Article, sectionConfig } from "./types";
import { getArticlesBySection } from "./data";
import {
  getCachedArticles,
  getCachedArticleDetail,
  getCachedBreakingNews,
} from "./sync-news";

const API_BASE = "https://api.freenewsapi.io/v1";
const API_KEY = process.env.FREENEWS_API_KEY ?? "";

const REVALIDATE_BREAKING = 60;
const REVALIDATE_LISTING = 300;
const REVALIDATE_DETAIL = 900;

export const SECTION_TOPIC_MAP: Record<Section, string> = {
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
  meta: {
    page_size: number;
    returned: number;
    has_more: boolean;
    next_offset: number;
    next_cursor: string;
  };
}

interface ArticleDetailData {
  uuid: string;
  title: string;
  thumbnail: string;
  publisher: string;
  authors: string[];
  topics: string[];
  countries: string[];
  languages: string[];
  published_at: string;
  original_url: string;
  incipit: string;
  body: string;
}

interface ArticleDetailResponse {
  data: ArticleDetailData;
}

// --- Fetch helper ---

async function apiFetch<T>(
  path: string,
  revalidateSeconds: number,
): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-api-key": API_KEY },
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// --- Mappers ---

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

const TOPIC_TO_SECTION: Record<string, Section> = {
  politics: "politica",
  sports: "deportes",
  rugby: "deportes",
  football: "deportes",
  soccer: "deportes",
  business: "economia",
  economy: "economia",
  finance: "economia",
  society: "internacionales",
  entertainment: "internacionales",
  health: "internacionales",
  science: "internacionales",
  technology: "internacionales",
  education: "internacionales",
  world: "internacionales",
};

function inferSection(topics: string[]): Section {
  for (const topic of topics) {
    const key = topic.toLowerCase();
    for (const [mapKey, section] of Object.entries(TOPIC_TO_SECTION)) {
      if (key.includes(mapKey)) return section;
    }
  }
  return "internacionales";
}

function mapNewsListItem(
  item: NewsListItem,
  section: Section,
): Article {
  return {
    id: item.uuid,
    title: item.title,
    section,
    publisher: item.publisher,
    date: formatDate(item.published_at),
    imageAlt: item.title,
    excerpt: "",
    featured: false,
    breaking: false,
    layout: "normal",
  };
}

function mapArticleDetail(detail: ArticleDetailData): Article {
  return {
    id: detail.uuid,
    title: detail.title,
    section: inferSection(detail.topics),
    author: detail.authors?.length ? detail.authors[0] : undefined,
    publisher: detail.publisher,
    date: formatDate(detail.published_at),
    imageUrl: detail.thumbnail || undefined,
    imageAlt: detail.title,
    excerpt: generateExcerpt(detail.incipit, detail.body),
    body: detail.body,
    originalUrl: detail.original_url || undefined,
    featured: false,
    breaking: false,
    layout: "normal",
  };
}

// --- Public API functions (cache-first) ---

export async function fetchSectionArticles(
  section: Section,
): Promise<Article[] | null> {
  // Try cached articles from Supabase first
  const cached = await getCachedArticles(section);
  if (cached.length > 0) return cached;

  // Fallback to live API
  const url =
    section === "tucuman"
      ? "/news?country=ar&language=es&in_body=Tucum%C3%A1n&page_size=12"
      : `/news?country=ar&language=es&topic=${SECTION_TOPIC_MAP[section]}&page_size=12`;

  const data = await apiFetch<NewsListResponse>(url, REVALIDATE_LISTING);
  if (!data) return null;

  // Fetch details for ALL articles so none are incomplete
  const detailPromises = data.data.map(async (item) => {
    const detail = await apiFetch<ArticleDetailResponse>(
      `/details?uuid=${item.uuid}`,
      REVALIDATE_DETAIL,
    );
    if (detail) return mapArticleDetail(detail.data);
    return mapNewsListItem(item, section);
  });

  return Promise.all(detailPromises);
}

export async function fetchArticleDetail(
  uuid: string,
): Promise<Article | null> {
  // Try cached article first
  const cached = await getCachedArticleDetail(uuid);
  if (cached) return cached;

  // Fallback to live API
  const data = await apiFetch<ArticleDetailResponse>(
    `/details?uuid=${uuid}`,
    REVALIDATE_DETAIL,
  );
  if (!data) return null;
  return mapArticleDetail(data.data);
}

export async function fetchBreakingNews(): Promise<Article[] | null> {
  // Breaking news comes from cached articles only (same data as sections)
  const cached = await getCachedBreakingNews();
  if (cached && cached.length > 0) return cached;
  return null;
}

export async function fetchHomepageArticles(): Promise<
  Record<Section, Article[]> | null
> {
  const sections = Object.keys(sectionConfig) as Section[];
  const results = await Promise.all(
    sections.map(async (section) => {
      const articles = await fetchSectionArticles(section);
      return { section, articles };
    }),
  );

  const allNull = results.every((r) => r.articles === null);
  if (allNull) return null;

  const mapped: Record<string, Article[]> = {};
  for (const { section, articles } of results) {
    mapped[section] = articles ?? getArticlesBySection(section);
  }
  return mapped as Record<Section, Article[]>;
}

function inferSectionFromTitle(title: string): Section {
  const lower = title.toLowerCase();
  if (
    lower.includes("tucumán") ||
    lower.includes("san miguel de tucumán") ||
    lower.includes("tucumano") ||
    lower.includes("tucumana")
  )
    return "tucuman";
  if (
    lower.includes("presidente") ||
    lower.includes("congreso") ||
    lower.includes("senado") ||
    lower.includes("ley ") ||
    lower.includes("gobierno") ||
    lower.includes("política") ||
    lower.includes("elecciones") ||
    lower.includes("diputados") ||
    lower.includes("ministro")
  )
    return "politica";
  if (
    lower.includes("fútbol") ||
    lower.includes("selección") ||
    lower.includes("torneo") ||
    lower.includes("deporte") ||
    lower.includes("mundial") ||
    lower.includes("partido") ||
    lower.includes("gol") ||
    lower.includes("atp") ||
    lower.includes("rugby") ||
    lower.includes("clásico") ||
    lower.includes("ufc")
  )
    return "deportes";
  if (
    lower.includes("dólar") ||
    lower.includes("economía") ||
    lower.includes("mercado") ||
    lower.includes("exportacione") ||
    lower.includes("banco central") ||
    lower.includes("inflación") ||
    lower.includes("finanzas")
  )
    return "economia";
  return "internacionales";
}