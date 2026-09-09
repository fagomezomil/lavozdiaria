import Link from "next/link";
import type { Article } from "@/lib/types";

/** Los 12 signos en orden zodiacal: slug (para match en títulos post-enhancer),
 *  nombre display y símbolo unicode. */
const SIGNOS: { slug: string; nombre: string; simbolo: string }[] = [
  { slug: "aries", nombre: "Aries", simbolo: "♈" },
  { slug: "tauro", nombre: "Tauro", simbolo: "♉" },
  { slug: "geminis", nombre: "Géminis", simbolo: "♊" },
  { slug: "cancer", nombre: "Cáncer", simbolo: "♋" },
  { slug: "leo", nombre: "Leo", simbolo: "♌" },
  { slug: "virgo", nombre: "Virgo", simbolo: "♍" },
  { slug: "libra", nombre: "Libra", simbolo: "♎" },
  { slug: "escorpio", nombre: "Escorpio", simbolo: "♏" },
  { slug: "sagitario", nombre: "Sagitario", simbolo: "♐" },
  { slug: "capricornio", nombre: "Capricornio", simbolo: "♑" },
  { slug: "acuario", nombre: "Acuario", simbolo: "♒" },
  { slug: "piscis", nombre: "Piscis", simbolo: "♓" },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Matchea la nota de un signo en el título ("Horóscopo de Aries hoy: ...").
 *  El título post-enhancer siempre nombra el signo con espacios alrededor. */
function matchSigno(title: string, slug: string): boolean {
  const n = normalize(title);
  return n.includes(` ${slug} `) || n.startsWith(`${slug} `) || n.endsWith(` ${slug}`);
}

/** Fila de chips de los 12 signos del zodíaco para la portada.
 *  Cada chip linka a la nota del signo del día si existe; si no, a /horoscopo. */
export default function HoroscopoWidget({ articles }: { articles: Article[] }) {
  const horoscopo = articles.filter((a) => a.section === "horoscopo");

  return (
    <section className="mb-10">
      <div
        className="border-t-2 pt-2 mb-4 flex items-center justify-between"
        style={{ borderTopColor: "var(--color-horoscopo)" }}
      >
        <h2 className="text-sm font-bold tracking-widest uppercase font-[family-name:var(--font-heading)]" style={{ color: "var(--color-horoscopo)" }}>
          Horóscopo
        </h2>
        <Link
          href="/horoscopo"
          className="text-xs font-semibold hover:underline"
          style={{ color: "var(--color-horoscopo)" }}
        >
          +Horóscopo
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        {SIGNOS.map((signo) => {
          const nota = horoscopo.find((a) => matchSigno(a.title, signo.slug));
          return (
            <Link
              key={signo.slug}
              href={nota ? `/horoscopo/${nota.id}` : "/horoscopo"}
              className="shrink-0 flex flex-col items-center justify-center gap-0.5 w-[72px] h-[72px] bg-paper border border-ink shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all"
            >
              <span className="text-2xl leading-none" style={{ color: "var(--color-horoscopo)" }}>
                {signo.simbolo}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide font-[family-name:var(--font-heading)]">
                {signo.nombre}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}