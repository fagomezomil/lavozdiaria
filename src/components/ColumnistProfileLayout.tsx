import Link from "next/link";
import type { Article, Ad, Columnist } from "@/lib/types";
import AdRotator from "@/components/AdRotator";

interface ColumnistProfileLayoutProps {
  columnist: Columnist;
  articles: Article[];
  leaderboardTop?: Ad | null;
  leaderboardBottom?: Ad | null;
  sidebarAds?: Ad[];
  page?: number;
  perPage?: number;
}

const PER_PAGE = 10;

export default function ColumnistProfileLayout({
  columnist,
  articles,
  leaderboardTop,
  leaderboardBottom,
  sidebarAds = [],
  page = 1,
  perPage = PER_PAGE,
}: ColumnistProfileLayoutProps) {
  const totalPages = Math.max(1, Math.ceil(articles.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = articles.slice(start, start + perPage);

  const name = columnist.name;
  const photoUrl = columnist.photoUrl;
  const bio = columnist.bio || "Columnista de ¡QUE NOTICIA!.";
  const totalColumns = articles.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Leaderboard top — full width 7xl */}
      {leaderboardTop && (
        <div className="mb-8">
          <AdRotator ads={[leaderboardTop]} size="leaderboard" />
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-6 flex items-center gap-1 font-[family-name:var(--font-heading)] uppercase tracking-widest">
        <Link href="/" className="hover:text-foreground transition-colors">Portada</Link>
        <span className="opacity-40">/</span>
        <Link href="/opinion" className="hover:text-foreground transition-colors text-opinion">Opinión</Link>
        <span className="opacity-40">/</span>
        <span className="truncate">{name}</span>
      </nav>

      {/* Masthead */}
      <header className="mb-8 border-b-2 border-opinion pb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted mb-2 font-[family-name:var(--font-heading)]">
          Columna de opinión · ¡QUE NOTICIA!
        </p>
        <h1
          className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-heading)] text-opinion leading-[0.95] tracking-tight"
          style={{ textTransform: "none" }}
        >
          {name}
        </h1>
      </header>

      {/* Grid 4 cols: 3 contenido + 1 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Contenido — 3 cols */}
        <div className="lg:col-span-3">
          {pageItems.length === 0 ? (
            <p className="text-muted italic py-12 text-center">Este columnista aún no publicó columnas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pageItems.map((a) => (
                <ColumnCard key={a.id} a={a} />
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-between border-t border-rule-opinion pt-4">
              {currentPage > 1 ? (
                <Link
                  href={`/opinion/columnista/${columnist.slug}?page=${currentPage - 1}`}
                  className="text-sm font-bold uppercase tracking-widest text-opinion hover:underline font-[family-name:var(--font-heading)]"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="text-sm text-muted/40 uppercase tracking-widest font-[family-name:var(--font-heading)]">← Anterior</span>
              )}
              <span className="text-xs text-muted font-[family-name:var(--font-heading)] uppercase tracking-widest">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={`/opinion/columnista/${columnist.slug}?page=${currentPage + 1}`}
                  className="text-sm font-bold uppercase tracking-widest text-opinion hover:underline font-[family-name:var(--font-heading)]"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="text-sm text-muted/40 uppercase tracking-widest font-[family-name:var(--font-heading)]">Siguiente →</span>
              )}
            </nav>
          )}
        </div>

        {/* Sidebar — 1 col */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Perfil */}
          <section className="border border-border rounded-md bg-paper p-5">
            <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-opinion mb-4 font-[family-name:var(--font-heading)] border-b border-rule-opinion pb-2">
              Perfil
            </h2>
            <div className="flex flex-col items-center text-center">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-opinion mb-3"
                />
              ) : (
                <span className="w-28 h-28 rounded-full bg-opinion/10 flex items-center justify-center text-4xl font-bold text-opinion font-[family-name:var(--font-heading)] border-4 border-opinion mb-3">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <p className="text-base font-bold text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide leading-tight">
                {name}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted font-[family-name:var(--font-heading)] mt-1 mb-3">
                Columnista
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {bio}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-rule-opinion flex justify-around">
              <div className="text-center">
                <p className="text-xl font-bold text-opinion font-[family-name:var(--font-heading)] leading-none">{totalColumns}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted font-[family-name:var(--font-heading)] mt-1">Columnas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-opinion font-[family-name:var(--font-heading)] leading-none">Opinión</p>
                <p className="text-[9px] uppercase tracking-widest text-muted font-[family-name:var(--font-heading)] mt-1">Sección</p>
              </div>
            </div>
          </section>

          {/* Avisos sidebar */}
          {sidebarAds.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-muted font-[family-name:var(--font-heading)]">
                Avisos
              </h2>
              {sidebarAds.slice(0, 4).map((ad) => (
                <div key={ad.id}>
                  <AdRotator ads={[ad]} size="sidebar" />
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>

      {/* Leaderboard bottom — full width 7xl */}
      {leaderboardBottom && (
        <div className="mt-12">
          <AdRotator ads={[leaderboardBottom]} size="leaderboard" />
        </div>
      )}
    </div>
  );
}

function ColumnCard({ a }: { a: Article }) {
  const volanta = a.volanta || "Opinión";
  return (
    <Link href={`/opinion/${a.id}`} className="group block mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
        <div className="sm:col-span-5 relative h-[180px] sm:h-[200px] rounded-md overflow-hidden border border-border bg-paper">
          {a.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.imageUrl}
              alt={a.imageAlt || a.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-opinion/10 flex items-center justify-center">
              <span className="text-4xl font-bold text-opinion/40 font-[family-name:var(--font-heading)]">
                {(a.author ?? "Q").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="sm:col-span-7 pb-3 border-b border-opinion flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-opinion font-bold mb-2 font-[family-name:var(--font-heading)]">
            {volanta}
          </p>
          <h3
            className="text-xl md:text-2xl font-bold font-[family-name:var(--font-heading)] text-ink leading-[1.15] tracking-tight group-hover:text-opinion transition-colors"
            style={{ textTransform: "none" }}
          >
            {a.title}
          </h3>
          {(a.subtitle || a.excerpt) && (
            <p className="mt-2 text-sm text-muted italic font-[family-name:var(--font-body)] line-clamp-2">
              {a.subtitle || a.excerpt}
            </p>
          )}
          <p className="mt-3 text-[10px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wider">
            {a.date}
          </p>
        </div>
      </div>
    </Link>
  );
}