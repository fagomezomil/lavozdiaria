import Link from "next/link";
import type { Article, Columnist } from "@/lib/types";

interface OpinionCardProps {
  article: Article;
  columnist?: Columnist;
}

export default function OpinionCard({ article, columnist }: OpinionCardProps) {
  const name = columnist?.name ?? article.author ?? "Redacción";
  const photoUrl = columnist?.photoUrl;
  const href = `/opinion/${article.id}`;
  const volanta = article.volanta || "Opinión";

  return (
    <Link
      href={href}
      className="group gap-3 items-start rounded-lg hover:bg-ink/5 transition-colors"
    >
      {/* Image background + circular avatar on top */}
      <div className="relative w-full h-32 mb-4 overflow-hidden rounded-lg">
        {article.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt={article.imageAlt || article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" }}
          />
        )}
        {/* Dark overlay for avatar contrast */}
        <div className="absolute inset-0 bg-ink/20" />
        {/* Circular avatar centered on top */}
        <div className="relative h-full flex items-center justify-center">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#0d9488] border-2 border-white shadow-lg">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#0d9488] mb-1 line-clamp-1">
            {volanta}
          </p>
          <h3 className="text-sm md:text-base font-bold text-ink font-heading leading-snug line-clamp-3 group-hover:underline decoration-[#0d9488] underline-offset-2">
            {article.title}
          </h3>
          <p className="text-xs text-muted mt-1 truncate">por {name}</p>
        </div>
      </div>
    </Link>
  );
}