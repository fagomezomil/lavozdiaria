import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getActiveArticles } from "@/lib/articles";
import { getActiveColumnists } from "@/lib/columnists";
import { getActiveSponsored } from "@/lib/sponsored";
import { getActiveEvents } from "@/lib/agenda";
import type { Section } from "@/lib/types";

/** sitemap.xml dinámico — generado via Next.js Metadata API.
 *  Lista: home, secciones, /clima, /agenda, columnistas, articles activos,
 *  contenidos patrocinados activos.
 *  Next.js divide automáticamente en chunks de 50k URLs si supera. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Páginas estáticas / secciones
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "always", priority: 1.0 },
    { url: `${SITE_URL}/politica`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/deportes`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/economia`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/internacionales`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/tucuman`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/opinion`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/actualidad`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/espectaculos`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/horoscopo`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/clima`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/agenda`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  // Columnistas
  let columnistPages: MetadataRoute.Sitemap = [];
  try {
    const columnists = await getActiveColumnists();
    columnistPages = columnists.map((c) => ({
      url: `${SITE_URL}/opinion/columnista/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // si falla, no rompemos el sitemap
  }

  // Articles activos
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const articles = await getActiveArticles();
    articlePages = articles.map((a) => {
      const lastMod = a.updated_at || a.created_at || a.date;
      return {
        url: `${SITE_URL}/${a.section}/${a.id}`,
        lastModified: lastMod ? new Date(lastMod) : now,
        changeFrequency: "daily",
        priority: 0.8,
      };
    });
  } catch {
    // si falla Supabase, sitemap sigue con lo estático
  }

  // Contenidos patrocinados activos (/patrocinado/[id])
  let sponsoredPages: MetadataRoute.Sitemap = [];
  try {
    const sponsored = await getActiveSponsored();
    sponsoredPages = sponsored.map((s) => ({
      url: `${SITE_URL}/patrocinado/${s.id}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch {
    // si falla, no rompemos el sitemap
  }

  return [...staticPages, ...columnistPages, ...articlePages, ...sponsoredPages];
}