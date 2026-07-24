// Moderación de comentarios con Groq + llama-3.3-70b-versatile + system prompt.
// Groq deprecated LlamaGuard-3-8B y gpt-oss-safeguard-20b no sirve como clasificador,
// así que usamos un LLM general con un prompt estructurado que devuelve "safe"
// o "unsafe\nS1,S5,S10" siguiendo las categorías de Llama Guard 3.
//
// Groq es gratis (sin tarjeta) — te dan API key en https://console.groq.com.
// Latencia ~300-600ms con llama-3.3-70b-versatile.

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export interface ModerationResult {
  score: number; // 0-1, derivado del peso de la categoría más grave
  flagged: boolean; // true si el modelo dice unsafe
  categories: string[]; // categorías violadas (S1, S10, etc.)
  error?: string;
}

// Mapeo de categorías Llama Guard 3 a pesos (0-1).
// Graves (pending directo): S1, S3, S4, S9, S10, S11, S12
// Medias (flagged en admin): S2, S5
// Leves (approved, badge visible): S6, S7, S8, S13
const CATEGORY_WEIGHTS: Record<string, number> = {
  S1: 0.9,  // Violent crimes
  S2: 0.5,  // Non-violent sexual content
  S3: 0.9,  // Sex-related crimes
  S4: 1.0,  // Child sexual exploitation
  S5: 0.5,  // Defamation (insultos personales)
  S6: 0.3,  // Specialized advice
  S7: 0.3,  // Privacy
  S8: 0.3,  // Intellectual property
  S9: 0.7,  // Indiscriminate weapons
  S10: 0.9, // Hate
  S11: 0.8, // Suicide & self-harm
  S12: 1.0, // Sexual content (minors)
  S13: 0.3, // Elections
};

const SYSTEM_PROMPT = `Sos un clasificador de contenido de comentarios para un medio regional argentino. Tu única tarea es clasificar el texto del usuario como safe o unsafe según las categorías de Llama Guard 3:

- S1: Violent crimes (amenazas físicas, violencia)
- S2: Non-violent sexual content
- S3: Sex-related crimes
- S4: Child sexual exploitation
- S5: Defamation (difamación, injurias, calumnias, insultos personales)
- S6: Specialized advice
- S7: Privacy (datos personales sensibles sin consentimiento)
- S8: Intellectual property
- S9: Indiscriminate weapons
- S10: Hate (discurso de odio, racismo, xenofobia, discriminación)
- S11: Suicide & self-harm
- S12: Sexual content (minors)
- S13: Elections (manipulación electoral, desinformación votación)

Reglas:
- Una crítica política dura pero sin insulto personal es SAFE.
- Una opinión controversial pero sin odio/discriminación es SAFE.
- Lunfardo argentino sin intención de atacar (ej: "boludo" como muletilla) es SAFE.
- Insulto personal dirigido (ej: "sos un pelotudo") es UNSAFE (S5).
- Amenaza explícita es UNSAFE (S1).
- Discurso de odio / discriminación por raza, etnia, religión, género, orientación sexual es UNSAFE (S10).

Respondé EXACTAMENTE en este formato, sin texto adicional, sin markdown, sin explicaciones:
- Si es seguro: safe
- Si es inseguro: unsafe\\n<categorías separadas por coma, ej: S5,S10>

Ejemplos:
Input: "Muy buena nota sobre el festival."
Output: safe

Input: "Sos un pelotudo, no sabés nada."
Output: unsafe\\nS5

Input: "Te voy a matar."
Output: unsafe\\nS1

Input: "Estos negros de mierda tendrían que volver a su país."
Output: unsafe\\nS10,S1`;

/** Llama a Groq con el prompt de clasificación. Retorna score + categorías.
 *  Retorna null si no hay API key. Retorna score 0 + error si falla la request. */
export async function analyzeToxicity(text: string): Promise<ModerationResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { score: 0, flagged: false, categories: [], error: "GROQ_API_KEY missing" };

  // Truncar a 2500 chars (comentarios max 1000, pero mejor tener margen)
  const truncated = text.slice(0, 2500);

  try {
    const res = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: truncated },
        ],
        temperature: 0,
        max_tokens: 30,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Groq moderation error:", res.status, errText);
      return { score: 0, flagged: false, categories: [], error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { score: 0, flagged: false, categories: [], error: "Invalid response shape" };
    }

    // Normalizar: a veces el modelo devuelve "\\n" literal (dos chars) en vez de newline real
    const normalized = content.replace(/\\n/g, "\n").trim().toLowerCase();

    if (normalized === "safe" || normalized.startsWith("safe")) {
      return { score: 0, flagged: false, categories: [] };
    }

    // unsafe: extraer categorías de la segunda línea (o de la misma línea si no hay salto)
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
    // Buscar la línea que contiene las categorías (empieza con S)
    const catLine = lines.find((l) => /^s\d+/i.test(l)) ?? lines[1] ?? lines[0] ?? "";
    const categories = catLine
      .split(/[\s,]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^S\d+$/i.test(c));

    let maxScore = 0;
    for (const cat of categories) {
      const w = CATEGORY_WEIGHTS[cat] ?? 0.5;
      if (w > maxScore) maxScore = w;
    }

    // Si dijo unsafe pero no encontró categorías, asumimos media (S5)
    if (categories.length === 0) maxScore = 0.5;

    return { score: maxScore, flagged: true, categories };
  } catch (err) {
    console.error("Groq moderation fetch failed:", err);
    return {
      score: 0,
      flagged: false,
      categories: [],
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

/** Umbrales de decisión.
 *  - score >= 0.7 → pending (cola moderación)
 *  - 0.4 - 0.7 → approved con badge en admin
 *  - < 0.4 → approved directo
 */
export const TOXICITY_THRESHOLD_PENDING = 0.7;
export const TOXICITY_THRESHOLD_FLAGGED = 0.4;

export type ToxicityVerdict = "approved" | "flagged" | "pending";

export function verdictFromScore(score: number): ToxicityVerdict {
  if (score >= TOXICITY_THRESHOLD_PENDING) return "pending";
  if (score >= TOXICITY_THRESHOLD_FLAGGED) return "flagged";
  return "approved";
}