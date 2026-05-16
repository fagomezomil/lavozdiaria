import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

// FreeNewsApi has SSL cert issues — disable verification in all environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default nextConfig;