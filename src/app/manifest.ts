import type { MetadataRoute } from "next";

/** Manifest de la PWA (sirve en /manifest.webmanifest).
 *  Iconos con purpose "any" (los PNG actuales no tienen safe-zone para
 *  maskable — Android los recortaría). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "¡QUE NOTICIA!",
    short_name: "QUE NOTICIA",
    description:
      "Las noticias de Tucumán: última hora, deportes, agenda cultural y más.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe4",
    theme_color: "#f97316",
    lang: "es-AR",
    categories: ["news"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}