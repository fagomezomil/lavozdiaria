import type { Metadata } from "next";
import { SECTION_META, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/site";
import { renderStandardSectionPage, SECTION_SUBTITLES } from "@/lib/section-page";

export const revalidate = 300;

export const metadata: Metadata = {
  title: SECTION_META.horoscopo.title,
  description: SECTION_META.horoscopo.description,
  alternates: { canonical: "/horoscopo" },
  openGraph: {
    title: `${SECTION_META.horoscopo.title} | ${SITE_NAME}`,
    description: SECTION_META.horoscopo.description,
    url: `${SITE_URL}/horoscopo`,
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    title: `${SECTION_META.horoscopo.title} | ${SITE_NAME}`,
    description: SECTION_META.horoscopo.description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function HoroscopoPage() {
  return renderStandardSectionPage("horoscopo", 1, SECTION_SUBTITLES.horoscopo);
}