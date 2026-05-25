import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Anti-scraping headers for article content: limit snippet size in search results
const contentHeaders = [
  ...securityHeaders,
  { key: "X-Robots-Tag", value: "max-snippet:200, max-image-preview:small" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      // Article pages: limited snippets to reduce scraping value
      { source: "/politica/:path*", headers: contentHeaders },
      { source: "/deportes/:path*", headers: contentHeaders },
      { source: "/economia/:path*", headers: contentHeaders },
      { source: "/internacionales/:path*", headers: contentHeaders },
      { source: "/tucuman/:path*", headers: contentHeaders },
      // All other pages: standard security headers
      { source: "/(.*)", headers: securityHeaders },
    ];
  },
};

export default nextConfig;