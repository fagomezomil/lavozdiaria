export type Section = "politica" | "deportes" | "economia" | "internacionales" | "tucuman";

export type AdType = "leaderboard" | "rectangle" | "sidebar" | "modal" | "infeed" | "sticky_footer";

export interface Ad {
  id: string;
  type: AdType;
  title: string;
  image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  section: Section | null;
  active: boolean;
  priority: number;
  starts_at: string | null;
  expires_at: string | null;
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
}

export interface CustomArticle extends Article {
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  comments_enabled: boolean;
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
};