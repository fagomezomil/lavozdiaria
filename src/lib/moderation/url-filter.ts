// Detección de URLs en comentarios — típico patrón de spam.
// Si un comentario contiene una URL, va a 'pending' siempre (sin importar toxicity).

const URL_PATTERNS: RegExp[] = [
  // URLs explícitas con protocolo
  /https?:\/\/[^\s<>"']+/i,
  // www. algo
  /\bwww\.[a-z0-9-]+\.[a-z]{2,}/i,
  // dominios comunes sin protocolo: ejemplo.com, ejemplo.es, etc
  /\b[a-z0-9-]+\.(com|es|net|org|io|xyz|info|biz|co|ar|mx|cl|uy|br|pe|crypto|site|online|store|shop|app|dev|tech|news|blog|media|tv|radio|live)\b/i,
  // shortened URLs (bit.ly, t.co, tinyurl, etc)
  /\b(bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly|shorturl\.at)\/[^\s<>"']+/i,
  // handles de redes sociales que típicamente promocionan
  /\b(@|segui|seguime|suscribite|suscribete|visitá|visita|link en|enlace en|whatsapp\.com\/|t\.me\/|instagram\.com\/|facebook\.com\/|tiktok\.com\/|youtube\.com\/|youtu\.be\/)/i,
];

/** Retorna true si el texto contiene algún patrón de URL o promoción típica de spam. */
export function containsUrl(text: string): { hasUrl: boolean; matched?: string } {
  const normalized = text.toLowerCase();
  for (const pattern of URL_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) return { hasUrl: true, matched: match[0] };
  }
  return { hasUrl: false };
}