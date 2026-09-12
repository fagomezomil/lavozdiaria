import type { Metadata, Viewport } from "next";
import { Oswald, Inter } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import BackToTop from "@/components/BackToTop";
import SWRegister from "@/components/pwa/SWRegister";
import JsonLd from "@/components/JsonLd";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_TWITTER,
  DEFAULT_OG_IMAGE,
} from "@/lib/site";
import { SOCIAL_LINKS } from "@/lib/social";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_TWITTER,
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

/** Structured data global: Organization (publisher) + WebSite.
 *  Sin SearchAction porque el sitio no tiene search endpoint todavía. */
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  description: SITE_DESCRIPTION,
  sameAs: [SOCIAL_LINKS.facebook, SOCIAL_LINKS.instagram].filter(Boolean),
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "es-AR",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`h-full antialiased ${oswald.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://uhuidlistqoonyqtpyvh.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://uhuidlistqoonyqtpyvh.supabase.co" />
      </head>
      <body className="min-h-full flex flex-col bg-cream font-[family-name:var(--font-body)] overflow-x-hidden">
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
        <GoogleAnalytics />
        <AuthProvider>
          {children}
          <BackToTop />
          <SWRegister />
        </AuthProvider>
      </body>
    </html>
  );
}