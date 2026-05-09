import { Section, Article, sectionConfig } from "./types";

export { sectionConfig } from "./types";
export type { Section, Article } from "./types";

export const articles: Article[] = [
  {
    id: "1",
    title: "El Congreso aprueba la nueva ley de transparencia presupuestaria",
    subtitle: "La legislación busca garantizar el acceso público a datos de gasto gubernamental",
    section: "politica",
    author: "María Fernanda López",
    publisher: "María Fernanda López",
    date: "8 de mayo de 2026",
    imageAlt: "Congreso Nacional en sesión",
    excerpt:
      "Tras meses de debate, la Cámara de Diputados alcanzó un acuerdo bipartidista para aprobar la Ley de Transparencia Presupuestaria, que obliga a todas las dependencias del Estado a publicar sus finanzas en formato abierto.",
    featured: true,
    breaking: true,
  },
  {
    id: "2",
    title: "La selección nacional se clasifica al mundial con goleada histórica",
    section: "deportes",
    author: "Carlos Rivas",
    publisher: "Carlos Rivas",
    date: "8 de mayo de 2026",
    imageAlt: "Jugadores celebrando el clasificatorio",
    excerpt:
      "Con una victoria 4-0 ante el rival regional, la selección selló su pase al Mundial 2026 en un estadio repleto que vibró con cada gol.",
    featured: true,
  },
  {
    id: "3",
    title: "El dólar cierra la semana en baja tras señales del Banco Central",
    section: "economia",
    author: "Andrea Molina",
    publisher: "Andrea Molina",
    date: "8 de mayo de 2026",
    imageAlt: "Gráficos de mercado financiero",
    excerpt:
      "Las medidas adoptadas por la autoridad monetaria generaron optimismo en los mercados, con una caída del 2.3% en la cotización de la divisa estadounidense.",
  },
  {
    id: "4",
    title: "Cumbre del G20 en Roma acuerda nuevo paquete de ayudas para países en desarrollo",
    section: "internacionales",
    author: "Patricia Gómez",
    publisher: "Patricia Gómez",
    date: "8 de mayo de 2026",
    imageAlt: "Líderes mundiales en la cumbre del G20",
    excerpt:
      "Los líderes de las principales economías del mundo alcanzaron un consenso sin precedentes para destinar fondos a programas de desarrollo sostenible en África y América Latina.",
  },
  {
    id: "5",
    title: "Debate presidencial genera controversia por ausencia de candidatos",
    section: "politica",
    author: "Roberto Sánchez",
    publisher: "Roberto Sánchez",
    date: "7 de mayo de 2026",
    imageAlt: "Podio vacío durante el debate",
    excerpt:
      "El debate organizado por el colegio electoral quedó marcado por la ausencia de dos de los tres candidatos principales, generando críticas desde distintos sectores.",
  },
  {
    id: "6",
    title: "El fútbol femenino registra récord de audiencia televisiva",
    section: "deportes",
    author: "Laura Torres",
    publisher: "Laura Torres",
    date: "7 de mayo de 2026",
    imageAlt: "Equipo femenino en celebración",
    excerpt:
      "La final del torneo femenino atrajo 3.2 millones de espectadores, superando por primera vez la audiencia del campeonato masculino.",
  },
  {
    id: "7",
    title: "Exportaciones agropecuarias crecen un 18% en el primer trimestre",
    section: "economia",
    author: "Fernando Díaz",
    publisher: "Fernando Díaz",
    date: "7 de mayo de 2026",
    imageAlt: "Puerto con contenedores de exportación",
    excerpt:
      "Los datos oficiales confirman un crecimiento sostenido en las ventas al exterior, impulsado por la demanda asiática de granos y proteínas.",
  },
  {
    id: "8",
    title: "Unión Europea y Mercosur avanzan hacia la ratificación del acuerdo comercial",
    section: "internacionales",
    author: "Patricia Gómez",
    publisher: "Patricia Gómez",
    date: "7 de mayo de 2026",
    imageAlt: "Bandera de la Unión Europea y Mercosur",
    excerpt:
      "Tras años de negociaciones, ambos bloques anunciaron avances significativos que podrían concretar el mayor acuerdo comercial del mundo.",
  },
  {
    id: "9",
    title: "Reforma tributaria avanza en comisión del Senado",
    section: "politica",
    author: "María Fernanda López",
    publisher: "María Fernanda López",
    date: "6 de mayo de 2026",
    imageAlt: "Senadores en sesión de comisión",
    excerpt:
      "La propuesta que busca modificar los tramos del impuesto a las ganancias obtuvo dictamen de mayoría en la comisión de hacienda.",
  },
  {
    id: "10",
    title: "Tenista local avanza a semifinales en torneo ATP 500",
    section: "deportes",
    author: "Carlos Rivas",
    publisher: "Carlos Rivas",
    date: "6 de mayo de 2026",
    imageAlt: "Tenista en acción sobre la cancha",
    excerpt:
      "Con una victoria en dos sets, el número uno del país se metió entre los cuatro mejores del torneo que se disputa en la capital.",
  },
  {
    id: "11",
    title: "Tucumán lidera el crecimiento económico del NOA en el primer trimestre",
    section: "tucuman",
    author: "Martín Ledesma",
    publisher: "Martín Ledesma",
    date: "8 de mayo de 2026",
    imageAlt: "Vista panorámica de San Miguel de Tucumán",
    excerpt:
      "La provincia registró un incremento del 12% en la actividad económica, impulsada por el sector agroindustrial y la reactivación del turismo regional.",
  },
  {
    id: "12",
    title: "Nueva ruta turística conecta las Yungas tucumanas con Salta",
    section: "tucuman",
    author: "Laura Méndez",
    publisher: "Laura Méndez",
    date: "7 de mayo de 2026",
    imageAlt: "Sendero en las Yungas tucumanas",
    excerpt:
      "El corredor biocéánico busca potenciar el ecoturismo y generar empleo en las comunidades locales de la región.",
  },
  {
    id: "13",
    title: "Atletico Tucumán suma tres refuerzos de jerarquía para el campeonato",
    section: "tucuman",
    author: "Diego Villalba",
    publisher: "Diego Villalba",
    date: "6 de mayo de 2026",
    imageAlt: "Estadio Monumental José Fierro",
    excerpt:
      "El decano cerró la contratación de un mediocampista, un defensor y un delantero con experiencia en primera división.",
  },
];

export function getArticlesBySection(section: Section): Article[] {
  return articles.filter((a) => a.section === section);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}

export function getBreakingNews(): Article[] {
  return articles.filter((a) => a.breaking);
}

export function getFeaturedArticles(): Article[] {
  return articles.filter((a) => a.featured);
}