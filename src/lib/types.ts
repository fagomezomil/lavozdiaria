export type Section = "politica" | "deportes" | "economia" | "internacionales" | "tucuman" | "opinion";

export type AgendaCategory = "cultural" | "turistico" | "deportivo";

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

export type ArticleLayout = "urgente" | "destacada" | "normal";

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
  breaking?: boolean;
  layout?: ArticleLayout;
  volanta?: string;
  columnistId?: string;
}

export interface CustomArticle extends Article {
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  comments_enabled: boolean;
  layout: ArticleLayout;
}

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

export interface Comment {
  id: string;
  article_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar_url: string | null;
  content: string;
  created_at: string;
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
};