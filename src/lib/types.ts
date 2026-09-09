export type Section = "politica" | "deportes" | "economia" | "internacionales" | "tucuman" | "opinion" | "actualidad" | "espectaculos";

export type AgendaCategory = "cultural" | "turistico" | "deportivo";

export type SportType = "futbol" | "basquet" | "rugby";

export type MatchStatus = "scheduled" | "live" | "played" | "postponed";

export interface SportsMatch {
  id: string;
  sport: SportType;
  tournament: string;
  season: string;
  matchday: number;
  match_id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
  match_date: string; // YYYY-MM-DD
  time: string | null;
  stadium: string | null;
  city: string | null;
  status: MatchStatus;
  team_colors: { home: string; away: string } | null;
  team_initials: { home: string; away: string } | null;
  is_local_tucuman: boolean;
  source_name: string;
  source_url: string | null;
  active: boolean;
}

export interface AgendaEvent {
  id: string;
  title: string;
  category: AgendaCategory;
  subcategory?: string;
  date: string;
  dateLabel: { num: string; name: string };
  time: string;
  venueName: string;
  venueCity: string;
  imageUrl?: string;
  imageAlt?: string;
  excerpt?: string;
  description?: string;
  price?: string;
  isFree?: boolean;
  ticketUrl?: string;
  sourceName: string;
  featured?: boolean;
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface EventSubmission {
  id: string;
  title: string;
  category: AgendaCategory;
  subcategory?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  endDate?: string;
  venueName?: string;
  venueCity?: string;
  venueAddress?: string;
  imageUrl?: string;
  description?: string;
  priceRange?: string;
  ticketUrl?: string;
  contactEmail?: string;
  submittedBy?: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedAt?: string;
  rejectionReason?: string;
  publishedEventId?: string;
}

export type ArticleLayout = "urgente" | "normal";

export type AdType = "leaderboard" | "rectangle" | "sidebar" | "modal" | "infeed" | "sticky_footer";

export interface Ad {
  id: string;
  type: AdType;
  title: string;
  image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  section: Section | null;
  client_id: string | null;
  client_name?: string | null;
  active: boolean;
  priority: number;
  display_duration: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phone_landline: string | null;
  postal_code: string | null;
  billing_address: string | null;
  billing_name: string | null;
  cuit: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
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
  featured?: boolean;
  // featured_at: cuándo se destacó (migración 039). El carrusel solo considera
  // featured de las últimas 24h. NULL = vencida o destacada antes del sistema.
  featured_at?: string | null;
  // pinned: fijada al heroEditorial indefinidamente, prioridad sobre featured.
  pinned?: boolean;
  breaking?: boolean;
  layout?: ArticleLayout;
  volanta?: string;
  columnistId?: string;
  sortDate?: string;
  enhancedAt?: string | null;
}

export interface CustomArticle extends Article {
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  comments_enabled: boolean;
  layout: ArticleLayout;
  // Campos del agente editorial (migración 034).
  source?: string | null;
  originalBody?: string | null;
  originalTitle?: string | null;
  enhancedAt?: string | null;
  enhancerVersion?: string | null;
  manualReviewRequired?: boolean;
  manuallyEdited?: boolean;
}

/** Artículo en estado de revisión por el agente editorial LLM. */
export interface RevisionArticle {
  id: string;
  title: string;
  originalTitle: string | null;
  body: string | null;
  originalBody: string | null;
  volanta: string | null;
  excerpt: string | null;
  section: Section;
  source: string;
  imageUrl: string | null;
  imageAlt: string;
  originalUrl: string | null;
  enhancedAt: string | null;
  enhancerVersion: string | null;
  manualReviewRequired: boolean;
}

/** Nombres friendly de fuentes draft (scraper → enhancer → revisión). */
export const DRAFT_SOURCE_LABELS: Record<string, string> = {
  contextotucuman: "Contexto",
  ambito: "Ámbito",
  tycsports: "TyC Sports",
  xataka: "Xataka",
  hipertextual: "Hipertextual",
  microsiervos: "Microsiervos",
  infobae_teleshow: "Infobae",
  eldestape: "El Destape",
};

export interface SponsoredContent {
  id: string;
  title: string;
  subtitle: string;
  section: Section;
  author: string | null;
  publisher: string;
  date: string;
  imageUrl: string | null;
  imageAlt: string;
  excerpt: string;
  body: string | null;
  originalUrl: string | null;
  active: boolean;
  showOnHomepage: boolean;
  showInSidebar: boolean;
  clientId: string | null;
  clientName?: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CommentStatus = "pending" | "approved" | "rejected" | "flagged";

export interface Comment {
  id: string;
  article_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar_url: string | null;
  content: string;
  created_at: string;
  status?: CommentStatus;
  toxicity_score?: number | null;
}

export interface Columnist {
  id: string;
  name: string;
  slug: string;
  photoUrl?: string;
  bio?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SectionConfig {
  label: string;
  color: string;
  path: string;
}

export const sectionConfig: Record<Section, SectionConfig> = {
  politica: { label: "Política", color: "#e63946", path: "/politica" },
  deportes: { label: "Deportes", color: "#3b82f6", path: "/deportes" },
  economia: { label: "Economía", color: "#10b981", path: "/economia" },
  internacionales: { label: "Internacionales", color: "#8b5cf6", path: "/internacionales" },
  tucuman: { label: "Tucumán", color: "#f59e0b", path: "/tucuman" },
  opinion: { label: "Opinión", color: "#0d9488", path: "/opinion" },
  actualidad: { label: "Actualidad", color: "#84cc16", path: "/actualidad" },
  espectaculos: { label: "Espectáculos", color: "#9a0bb9", path: "/espectaculos" },
};

/** Renombres de fuentes para display en cards y artículos.
 *  Claves son el valor exacto del campo `author` en Supabase. */
export const SOURCE_RENAMES: Record<string, string> = {
  "Comunicación Pública Gobierno de Tucumán": "Comunicación Tuc",
  "Asociación del Fútbol Argentino": "AFA",
};

/** Devuelve el nombre display de una fuente, aplicando renames si existen. */
export function displaySource(author: string | undefined): string | undefined {
  if (!author) return undefined;
  return SOURCE_RENAMES[author] ?? author;
}