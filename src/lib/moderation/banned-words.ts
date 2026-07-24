// Lista de palabras graves que resultan en rechazo directo del comentario.
// Match normalizado: lowercase, sin acentos, sin espacios extra.
// No es exhaustiva — el complemento es Perspective API (toxicity score).

const RAW_BANNED_WORDS: string[] = [
  // Insultos fuertes (es-AR)
  "pelotudo", "pelotuda", "pelotudos", "pelotudas",
  "imbecil", "imbeciles", "imbecilla",
  "forro", "forra", "forros", "forras",
  "boludo", "boluda", "boludos", "boludas",
  "conchudo", "conchuda", "conchudos", "conchudas",
  "pelotudo",
  "puto", "puta", "putos", "putas",
  "hijo de puta", "hija de puta",
  "marica", "maricon", "maricona", "maricones",
  "trolo", "trola", "troles",
  "tragasables", "tragasable",
  // Odio / discriminación
  "negro de mierda", "negra de mierda",
  "indio de mierda", "india de mierda",
  "judio de mierda", "judia de mierda",
  "nazi", "nazis",
  "faso", "fascista", "fascistas",
  // Amenazas
  "te voy a matar", "te mato", "te voy a reventar",
  "muerte a", "abajo",
  // Spam / scam típico
  "crypto giveaway", "free bitcoin", "enviame dinero",
  "whatsapp +", "contactame al",
  // Severas
  "pedofilo", "pedofila", "pedofilos", "pedofilas",
  "violador", "violadora", "violadores",
  "violar", "violen",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ")
    .trim();
}

const BANNED_WORDS_SET = new Set(RAW_BANNED_WORDS.map(normalize));

/** Retorna true si el texto contiene alguna palabra grave.
 *  Usa normalización + set lookup + includes para frases multi-palabra. */
export function containsBannedWord(text: string): { banned: boolean; matched?: string } {
  const normalized = normalize(text);
  if (!normalized) return { banned: false };

  for (const word of BANNED_WORDS_SET) {
    if (word.includes(" ")) {
      if (normalized.includes(word)) return { banned: true, matched: word };
    } else {
      // word-boundary para no matchear substrings (ej: "puta" en "computacion")
      const re = new RegExp(`(^|[^a-z])${word}([^a-z]|$)`, "i");
      if (re.test(normalized)) return { banned: true, matched: word };
    }
  }
  return { banned: false };
}