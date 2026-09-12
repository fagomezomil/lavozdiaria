import type { NextConfig } from "next";

// X-Robots-Tag limita snippet size en search results para reducir valor de scraping.
// Los headers de seguridad (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
// Permissions-Policy, CSP) los manda Caddy en el edge — acá solo dejamos X-Robots-Tag.
const articleRobotsHeader = [
  { key: "X-Robots-Tag", value: "max-snippet:200, max-image-preview:small" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Acotado a los hostnames reales de las fuentes del scraper + Supabase
    // Storage + medios replicados (ver src/lib/stats.ts REPLICATED_DOMAINS).
    // Antes era hostname: "**" que dejaba _next/image como proxy abierto.
    remotePatterns: [
      // Cloudflare R2 — imágenes migradas desde Supabase Storage (2026-09-04)
      { protocol: "https", hostname: "pub-7d90620b77a845bcbb1bf3fee8f467a2.r2.dev" },
      // Supabase Storage (avatars, fallback para imágenes viejas no migradas)
      { protocol: "https", hostname: "uhuidlistqoonyqtpyvh.supabase.co" },
      // 5 fuentes locales del scraper
      { protocol: "https", hostname: "contextotucuman.com" },
      { protocol: "https", hostname: "**.contextotucuman.com" },
      { protocol: "https", hostname: "comunicaciontucuman.gob.ar" },
      { protocol: "https", hostname: "**.comunicaciontucuman.gob.ar" },
      { protocol: "https", hostname: "comunicacionsmt.gob.ar" },
      { protocol: "https", hostname: "**.comunicacionsmt.gob.ar" },
      { protocol: "https", hostname: "ambito.com" },
      { protocol: "https", hostname: "**.ambito.com" },
      { protocol: "https", hostname: "tycsports.com" },
      { protocol: "https", hostname: "**.tycsports.com" },
      // Medios replicados (REPLICATED_DOMAINS en src/lib/stats.ts)
      { protocol: "https", hostname: "tn.com.ar" },
      { protocol: "https", hostname: "**.tn.com.ar" },
      { protocol: "https", hostname: "clarin.com" },
      { protocol: "https", hostname: "**.clarin.com" },
      { protocol: "https", hostname: "lanacion.com.ar" },
      { protocol: "https", hostname: "**.lanacion.com.ar" },
      { protocol: "https", hostname: "infobae.com" },
      { protocol: "https", hostname: "**.infobae.com" },
      { protocol: "https", hostname: "telam.com.ar" },
      { protocol: "https", hostname: "**.telam.com.ar" },
      { protocol: "https", hostname: "elliberal.com.ar" },
      { protocol: "https", hostname: "**.elliberal.com.ar" },
      { protocol: "https", hostname: "losprimerostucuman.com" },
      { protocol: "https", hostname: "**.losprimerostucuman.com" },
      { protocol: "https", hostname: "pagina12.com.ar" },
      { protocol: "https", hostname: "**.pagina12.com.ar" },
      { protocol: "https", hostname: "lagaceta.com.ar" },
      { protocol: "https", hostname: "**.lagaceta.com.ar" },
    ],
  },
  // @resvg/resvg-js, sharp y takumi usan bindings/binarios nativos — deben quedar fuera del bundler.
  // takumi-js via @takumi-rs/core importa un .node binary que Turbopack no puede empaquetar.
  serverExternalPackages: ["@resvg/resvg-js", "sharp", "takumi-js", "@takumi-rs/core"],
  async headers() {
    return [
      // Article pages: limited snippets to reduce scraping value
      { source: "/politica/:path*", headers: articleRobotsHeader },
      { source: "/deportes/:path*", headers: articleRobotsHeader },
      { source: "/economia/:path*", headers: articleRobotsHeader },
      { source: "/internacionales/:path*", headers: articleRobotsHeader },
      { source: "/tucuman/:path*", headers: articleRobotsHeader },
      { source: "/actualidad/:path*", headers: articleRobotsHeader },
      { source: "/espectaculos/:path*", headers: articleRobotsHeader },
      { source: "/horoscopo/:path*", headers: articleRobotsHeader },
    ];
  },
};

export default nextConfig;