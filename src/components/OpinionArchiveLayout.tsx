import Link from "next/link";
import { Article, Ad, Columnist, sectionConfig } from "@/lib/types";
import AdRotator from "@/components/AdRotator";

interface OpinionArchiveLayoutProps {
  articles: Article[];
  columnists: Columnist[];
  page: number;
  perPage?: number;
  leaderboardTop?: Ad | null;
  leaderboardBottom?: Ad | null;
  sidebarAds?: Ad[];
}

const PER_PAGE = 7; // 1 principal + 6 cards (1 por fila)

function Card({ a, columnist }: { a: Article; columnist?: Columnist }) {
  const name = columnist?.name ?? a.author ?? "Redacción";
  const photoUrl = columnist?.photoUrl;
  const volanta = a.volanta || "Opinión";
  return (
    <Link href={`/opinion/${a.id}`} className="group block mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
        {/* Imagen — 5 cols en sm+ */}
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
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {/* Contenido — 7 cols en sm+ */}
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
          <div className="mt-3 flex items-center gap-2.5">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-opinion/15 flex items-center justify-center text-[11px] font-bold text-opinion font-[family-name:var(--font-heading)] shrink-0">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide leading-tight truncate">
                {name}
              </p>
              <p className="text-[10px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wider">
                {a.date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function OpinionArchiveLayout({
  articles,
  columnists,
  page,
  perPage = PER_PAGE,
  leaderboardTop,
  leaderboardBottom,
  sidebarAds = [],
}: OpinionArchiveLayoutProps) {
  const cfg = sectionConfig.opinion;
  const columnistById = new Map(columnists.map((c) => [c.id, c]));

  const totalPages = Math.max(1, Math.ceil(articles.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = articles.slice(start, start + perPage);

  const principal = pageItems[0];
  const gridItems = pageItems.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Masthead */}
      <header className="mb-6 border-b-2 border-opinion pb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted mb-2 font-[family-name:var(--font-heading)]">
          Sección de Opinión · ¡QUE NOTICIA!
        </p>
        <h1
          className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-heading)] text-opinion leading-[0.95] tracking-tight"
          style={{ textTransform: "none" }}
        >
          Opinión
        </h1>
        <p className="mt-3 text-base text-muted italic max-w-2xl font-[family-name:var(--font-body)]">
          Columnas de nuestros columnistas. La voz de quienes interpretan la actualidad.
        </p>
      </header>

      {/* Leaderboard top — full width 7xl, abajo del título */}
      {leaderboardTop && (
        <div className="mb-8">
          <AdRotator ads={[leaderboardTop]} size="leaderboard" />
        </div>
      )}

      {/* Main grid — 4 cols: 3 contenido + 1 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Contenido — 3 cols */}
        <div className="lg:col-span-3">
          {/* Nota principal — la más reciente */}
          {principal && (
            <PrincipalCard a={principal} columnist={principal.columnistId ? columnistById.get(principal.columnistId) : undefined} />
          )}

          {/* Listado de cards — 1 por fila, destacadas */}
          {gridItems.length > 0 && (
            <div className="mt-8">
              {gridItems.map((a) => (
                <Card
                  key={a.id}
                  a={a}
                  columnist={a.columnistId ? columnistById.get(a.columnistId) : undefined}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-between border-t border-rule-opinion pt-4">
              {currentPage > 1 ? (
                <Link
                  href={`/opinion?page=${currentPage - 1}`}
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
                  href={`/opinion?page=${currentPage + 1}`}
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

        {/* Sidebar — 1 col con columnistas + avisos */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Columnistas */}
          {columnists.length > 0 && (
            <section className="border border-border rounded-md bg-paper p-4">
              <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-opinion mb-4 font-[family-name:var(--font-heading)] border-b border-rule-opinion pb-2">
                Columnistas
              </h2>
              <ul className="space-y-3">
                {columnists.map((c) => (
                  <li key={c.id}>
                    <Link href={`/opinion/columnista/${c.slug}`} className="flex items-center gap-3 -mx-2 px-2 py-1 rounded transition-colors hover:bg-opinion/5 group">
                      {c.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.photoUrl}
                          alt={c.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-opinion/10 flex items-center justify-center text-sm font-bold text-opinion font-[family-name:var(--font-heading)] shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide leading-tight truncate group-hover:text-opinion transition-colors">
                          {c.name}
                        </p>
                        {c.bio && (
                          <p className="text-[10px] text-muted italic line-clamp-1 leading-snug">
                            {c.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Avisos sidebar — hasta 4 */}
          {sidebarAds.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-muted font-[family-name:var(--font-heading)]">
                Avisos
              </h2>
              {sidebarAds.slice(0, 4).map((ad, i) => (
                <div key={ad.id} className="mb-4">
                  <AdRotator ads={[ad]} size="sidebar" />
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>

      {/* Leaderboard bottom — full width 7xl, antes del footer */}
      {leaderboardBottom && (
        <div className="mt-12">
          <AdRotator ads={[leaderboardBottom]} size="leaderboard" />
        </div>
      )}
    </div>
  );
}

function PrincipalCard({ a, columnist }: { a: Article; columnist?: Columnist }) {
  const name = columnist?.name ?? a.author ?? "Redacción";
  const photoUrl = columnist?.photoUrl;
  const volanta = a.volanta || "Opinión";

  return (
    <Link href={`/opinion/${a.id}`} className="group block">
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <div className="relative h-[240px] md:h-[290px] w-full md:w-[calc(60%-50px)] md:shrink-0 rounded-md overflow-hidden border border-border bg-paper">
          {a.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.imageUrl}
              alt={a.imageAlt || a.title}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-opinion/10 flex items-center justify-center">
              <span className="text-6xl font-bold text-opinion/30 font-[family-name:var(--font-heading)]">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 border-t border-b border-opinion py-3 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-opinion font-bold mb-2 font-[family-name:var(--font-heading)]">
            {volanta} · Por {name}
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-ink leading-[1.05] tracking-tight group-hover:text-opinion transition-colors"
            style={{ textTransform: "none" }}
          >
            {a.title}
          </h2>
          {(a.subtitle || a.excerpt) && (
            <p className="mt-3 text-base text-muted italic font-[family-name:var(--font-body)] line-clamp-3">
              {a.subtitle || a.excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-12 h-12 rounded-full bg-opinion/15 flex items-center justify-center text-base font-bold text-opinion font-[family-name:var(--font-heading)] shrink-0">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted font-[family-name:var(--font-heading)]">
                Columna de
              </p>
              <p className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] uppercase tracking-wide leading-tight truncate">
                {name}
              </p>
              <p className="text-[10px] text-muted font-[family-name:var(--font-heading)] uppercase tracking-wider mt-0.5">
                {a.date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}