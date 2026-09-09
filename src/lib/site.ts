/** Configuración central del sitio para SEO metadata, sitemap, robots, OG tags. */

export const SITE_URL = "https://www.quenoticia.com.ar";
export const SITE_NAME = "¡QUE NOTICIA!";
export const SITE_TAGLINE = "El universo de las noticias en un clic";
export const SITE_DESCRIPTION =
  "Portal de noticias regional de Tucumán, Argentina. Política, deportes, economía, internacionales, opinión y más.";
export const SITE_LOCALE = "es_AR";
export const SITE_TWITTER = "@quenoticiatuc";

/** Metadata base para OpenGraph y Twitter cards. Usado como default en layout,
 *  overrideable por página. */
export const DEFAULT_OG_IMAGE = "/logo/logodesktop.png";

/** Descripciones únicas por sección para metadata. */
export const SECTION_META: Record<
  string,
  { title: string; description: string }
> = {
  politica: {
    title: "Política Argentina y Tucumán",
    description:
      "Noticias de política nacional, provincial y tucumana. Cobertura de gobierno, congreso, elecciones y análisis político.",
  },
  deportes: {
    title: "Deportes Tucumán y el mundo",
    description:
      "Fútbol, tenis, basket, vóley y más deportes de Tucumán, Argentina y el mundo. Resultados, transferencias y cobertura en vivo.",
  },
  economia: {
    title: "Economía y finanzas",
    description:
      "Noticias de economía nacional, provinciana y mercados. Dólar, inflación, inversiones, agroindustria tucumana y análisis financiero.",
  },
  internacionales: {
    title: "Internacionales",
    description:
      "Noticias del mundo. Política internacional, conflictos, economía global, ciencia y cultura desde todos los continentes.",
  },
  tucuman: {
    title: "Tucumán — Noticias provincianas",
    description:
      "Noticias de San Miguel de Tucumán y el interior provinciano. Gobierno, municipios, sociedad, cultura y eventos locales.",
  },
  opinion: {
    title: "Opinión y columnistas",
    description:
      "Columnistas de ¡QUE NOTICIA! analizan política, economía, deportes y sociedad. Editoriales, opinión firmada y debate de ideas.",
  },
  actualidad: {
    title: "Actualidad — Ciencia, tecnología e IA",
    description:
      "Ciencia, tecnología, IA, descubrimientos, lanzamientos y datos que te sorprenden. Noticias de actualidad del mundo tech y científico.",
  },
  espectaculos: {
    title: "Espectáculos — Farándula argentina",
    description:
      "Farándula, famosos y todo el mundo del entretenimiento argentino. Noticias de espectáculos, TV, música y cine.",
  },
  horoscopo: {
    title: "Horóscopo — Predicciones del zodíaco",
    description:
      "Horóscopo de hoy para los 12 signos del zodíaco: amor, dinero, trabajo y salud. Predicciones diarias de ¡QUE NOTICIA!.",
  },
};