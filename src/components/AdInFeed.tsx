import type { Ad } from "@/lib/types";
import Link from "next/link";

interface AdInFeedProps {
  ad: Ad;
}

export default function AdInFeed({ ad }: AdInFeedProps) {
  const imgSrc = ad.mobile_image_url || ad.image_url;

  return (
    <div className="bg-paper border border-border overflow-hidden group rounded-sm">
      <Link
        href={ad.link_url || "#"}
        target={ad.link_url ? "_blank" : undefined}
        rel={ad.link_url ? "noopener noreferrer" : undefined}
        className="block"
      >
        {imgSrc ? (
          <picture>
            <source media="(max-width: 767px)" srcSet={ad.mobile_image_url || ad.image_url!} />
            <img
              src={ad.image_url!}
              alt={ad.title || "Aviso publicitario"}
              className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </picture>
        ) : (
          <div className="w-full h-44 bg-[#f0efed] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#ccc]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
        <div className="p-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted">
            Aviso publicitario
          </span>
          <h3 className="mt-1 text-lg font-bold leading-snug font-[family-name:var(--font-heading)]">
            {ad.title || "Aviso publicitario"}
          </h3>
        </div>
      </Link>
    </div>
  );
}