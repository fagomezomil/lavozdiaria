/** Mockups de stories de agenda estilo EventModal — 4 placas: 3 eventos (1 por categoría) + listado del día. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "takumi-js";
import { loadFonts } from "../src/lib/social/fonts";
import {
  INK,
  HALFTONE_WHITE_SOFT,
  STORY_W,
  STORY_H,
  WebText,
} from "../src/lib/social/slide-template-v2";

const PAPER = "#fdfbf7";
const CREAM = "#f5efe4";
const MUTED = "#6b6257";

/** Corte automático de descripción a N palabras (para descripciones largas). */
function cortarPalabras(texto: string, max: number): string {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (palabras.length <= max) return texto;
  return palabras.slice(0, max).join(" ") + "...";
}
const AGENDA = "#db2777";
const DEEP = "#be185d";

const CAT_COLOR: Record<string, string> = {
  cultural: "#db2777",
  turistico: "#0891b2",
  deportivo: "#65a30d",
};
const CAT_LABEL: Record<string, string> = {
  cultural: "Cultural",
  turistico: "Turístico",
  deportivo: "Deportivo",
};

interface Ev {
  name: string;
  cat: string;
  title: string;
  time: string;
  venue: string;
  city: string;
  price: string | null;
  free: boolean;
  desc: string | null;
  image: string;
}

/** Eventos reales de hoy (2026-09-12, tabla events). */
const EVENTOS: Ev[] = [
  {
    name: "1-cultural",
    cat: "cultural",
    title: "La Bella Durmiente — Ballet de San Petersburgo",
    time: "21:00 hs",
    venue: "Teatro Mercedes Sosa",
    city: "San Miguel de Tucumán",
    price: "$50.000 – $80.000",
    free: false,
    desc: null,
    image: "https://mercedessosa.blob.core.windows.net/fotos-espetaculos/mcfFszSIjkKRbf6TDgm0Ag.png",
  },
  {
    name: "2-deportivo",
    cat: "deportivo",
    title: "XX La Carrera del Lago",
    time: "09:00 hs",
    venue: "Embalse Escaba",
    city: "Juan Bautista Alberdi",
    price: null,
    free: true,
    desc: null,
    image: "https://tucumanturismo.gob.ar/public/img/ESCABA_cljlvtp9_28-08-2026.jpg",
  },
  {
    name: "3-turistico",
    cat: "turistico",
    title: "Ruta de la Fe — Norte",
    time: "17:00 hs",
    venue: "Oficina de Informes",
    city: "San Miguel de Tucumán",
    price: null,
    free: true,
    desc: "Salida: sábado 12 de septiembre a las 17:00 desde la Oficina de Informes de San Miguel de Tucumán, con regreso previsto a las 21:30 horas. La actividad requiere inscripción previa y forma parte de la programación especial del Mes del Turismo 2026, que incluye recorridos guiados por el circuito norte de la provincia visitando localidades emblemáticas y paradas en puntos panorámicos para apreciar el paisaje y la gastronomía regional de cada pueblo. La Ruta de la Fe conecta santuarios e iglesias históricas del norte tucumano, combinando patrimonio religioso con paisajes de montaña.",
    image: "https://tucumanturismo.gob.ar/public/img/WhatsA_krm6am5x_03-09-2026.jpeg",
  },
];

const LISTADO: Array<{ time: string; title: string; venue: string; cat: string; dayLabel?: string }> = [
  { time: "09:00", title: "XX La Carrera del Lago", venue: "Embalse Escaba · J.B. Alberdi", cat: "deportivo" },
  { time: "09:00", title: "Tucumán Epic 2026", venue: "San Javier", cat: "deportivo" },
  { time: "17:00", title: "Ruta de la Fe — Norte", venue: "Oficina de Informes · S.M. Tucumán", cat: "turistico" },
  { time: "18:00", title: "Norte Rock 2026", venue: "Yerba Buena", cat: "cultural" },
  { time: "19:30", title: "La Fiesta del Pop — Showchoirs Tucumán", venue: "Teatro Caviglia", cat: "cultural" },
  { time: "10:00", title: "City Tour Tafí del Valle", venue: "Plaza Independencia · Tafí Viejo", cat: "turistico", dayLabel: "Mañana — Domingo 13" },
  { time: "11:00", title: "Feria de Artesanos", venue: "Plaza 9 de Julio · S.M. Tucumán", cat: "cultural", dayLabel: "Mañana — Domingo 13" },
  { time: "20:00", title: "Festival Gastronómico del Norte", venue: "Yerba Buena", cat: "cultural", dayLabel: "Mañana — Domingo 13" },
];

/** Fondo story: ink + halftone + barra rosa agenda (como el backdrop del modal). */
function Fondo({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: STORY_W,
        height: STORY_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: STORY_W,
          height: STORY_H,
          backgroundImage: HALFTONE_WHITE_SOFT,
          backgroundSize: "12px 12px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: STORY_W,
          height: 14,
          backgroundColor: AGENDA,
        }}
      />
      {children}
    </div>
  );
}

function DatePill(): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 44,
        backgroundColor: PAPER,
        boxShadow: "0 0 0 3px " + INK,
        padding: "12px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 44,
          color: DEEP,
          lineHeight: 1,
        }}
      >
        12
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          color: INK,
          marginTop: 4,
        }}
      >
        Sábado
      </div>
    </div>
  );
}

/** Chip de precio o Gratis (isFree → bg deportivo, como el modal). */
function PriceChip({ price, free }: { price: string | null; free: boolean }) {
  if (free) {
    return (
      <div
        style={{
          backgroundColor: CAT_COLOR.deportivo,
          color: "#ffffff",
          boxShadow: "0 0 0 3px " + CAT_COLOR.deportivo,
          padding: "8px 16px",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          fontFamily: "Oswald",
        }}
      >
        Gratis
      </div>
    );
  }
  if (!price) return <div style={{ display: "none" }} />;
  return (
    <div
      style={{
        backgroundColor: PAPER,
        boxShadow: "0 0 0 3px " + INK,
        padding: "8px 16px",
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2.4,
        textTransform: "uppercase",
        fontFamily: "Oswald",
        color: INK,
      }}
    >
      {price}
    </div>
  );
}

/** Placa de evento: hero imagen full-bleed 1400px + body paper 520px. Sin card ni footer. */
function EventCard({ ev, imageDataUrl }: { ev: Ev; imageDataUrl: string | null }): React.ReactElement {
  const catColor = CAT_COLOR[ev.cat];
  return (
    <div
      style={{
        width: STORY_W,
        height: STORY_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
        display: "flex",
      }}
    >
      {/* Hero imagen full-bleed */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 1400,
          backgroundColor: catColor,
          display: "flex",
        }}
      >
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1400, objectFit: "cover" }}
          />
        )}
      </div>

      {/* Barra rosa agenda sobre la imagen */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 14,
          backgroundColor: AGENDA,
        }}
      />

      <DatePill />

      {/* Gradiente + body anclados abajo: el gradiente queda siempre sobre la
          imagen y encima del body; se mueven juntos si el body crece. */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 1080,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 1080,
            height: 160,
            background: "linear-gradient(to top, rgba(253,251,247,1), rgba(253,251,247,0))",
          }}
        />
        <div
          style={{
            width: 1080,
            minHeight: 520,
            backgroundColor: PAPER,
            padding: "30px 48px 40px",
            display: "flex",
            flexDirection: "column",
          }}
        >
        {/* Chips */}
        <div style={{ display: "flex", flexDirection: "row", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
          <div
            style={{
              backgroundColor: catColor,
              color: "#ffffff",
              padding: "7px 16px",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              fontFamily: "Oswald",
            }}
          >
            {CAT_LABEL[ev.cat]}
          </div>
          <div
            style={{
              backgroundColor: PAPER,
              boxShadow: "0 0 0 3px " + INK,
              padding: "7px 16px",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              fontFamily: "Oswald",
              color: INK,
            }}
          >
            {ev.time}
          </div>
          <PriceChip price={ev.price} free={ev.free} />
        </div>

        {/* Título */}
        <div
          style={{
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: 54,
            lineHeight: 1.08,
            color: INK,
            marginBottom: 18,
          }}
        >
          {ev.title}
        </div>

        {/* Descripción */}
        {ev.desc && (
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 25,
              lineHeight: 1.45,
              color: "rgba(10,10,10,.85)",
              marginBottom: 14,
            }}
          >
            {ev.desc && cortarPalabras(ev.desc, 40)}
          </div>
        )}

        {/* Datos clave */}
        <div
          style={{
            boxShadow: "0 0 0 3px " + INK,
            backgroundColor: CREAM,
            padding: "22px 28px",
            marginTop: 20,
            marginBottom: 20,
            display: "flex",
            flexDirection: "row",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", width: 340 }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 2.2,
                textTransform: "uppercase",
                fontWeight: 600,
                color: MUTED,
                fontFamily: "Oswald",
                marginBottom: 5,
              }}
            >
              Fecha y hora
            </div>
            <div style={{ fontSize: 31, fontWeight: 600, fontFamily: "Oswald", color: INK }}>
              Sábado 12 · {ev.time}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 2.2,
                textTransform: "uppercase",
                fontWeight: 600,
                color: MUTED,
                fontFamily: "Oswald",
                marginBottom: 5,
              }}
            >
              Lugar
            </div>
            <div
              style={{
                fontSize: 31,
                fontWeight: 600,
                fontFamily: "Oswald",
                color: INK,
                textTransform: "uppercase",
                letterSpacing: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {ev.venue}
            </div>
            <div style={{ fontSize: 26, color: MUTED, marginTop: 0 }}>{ev.city}</div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            style={{
              backgroundColor: AGENDA,
              color: "#ffffff",
              boxShadow: "6px 6px 0 " + INK,
              padding: "16px 30px",
              fontFamily: "Oswald",
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: 2.4,
              textTransform: "uppercase",
            }}
          >
            Más en agenda {">"}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

/** Placa listado del día: full-bleed, header ink + lista paper + footer con logo. */
function Listado({ logoWhiteDataUrl }: { logoWhiteDataUrl: string }): React.ReactElement {
  type Row = { kind: "ev"; time: string; title: string; venue: string; cat: string } | { kind: "sep"; label: string };
  const rows: Row[] = [];
  LISTADO.forEach((e, i) => {
    if (e.dayLabel && (i === 0 || LISTADO[i - 1].dayLabel !== e.dayLabel)) {
      rows.push({ kind: "sep", label: e.dayLabel });
    }
    rows.push({ kind: "ev", time: e.time, title: e.title, venue: e.venue, cat: e.cat });
  });
  return (
    <Fondo>
      {/* Header ink — fijo 340px, contenido centrado vertical */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 48,
          width: 984,
          height: 326,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: 92,
            lineHeight: 1.05,
          }}
        >
          <div style={{ color: AGENDA }}>AGENDA</div>
          <div style={{ color: "#ffffff" }}>TUCUMANA</div>
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 34,
            color: "#c9c2b4",
            marginTop: 16,
            textTransform: "capitalize",
          }}
        >
          sábado 12 de septiembre · Tucumán
        </div>
      </div>

      {/* Lista paper full-bleed — body fijo 1240px */}
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 0,
          width: 1080,
          height: 1240,
          backgroundColor: PAPER,
          padding: "30px 48px 36px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {rows.map((row, idx) =>
          row.kind === "sep" ? (
            <div
              key={`sep-${idx}`}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: idx < rows.length - 1 ? "1px solid rgba(10,10,10,.14)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "Oswald",
                  fontWeight: 600,
                  fontSize: 26,
                  color: MUTED,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                }}
              >
                {row.label}
              </div>
            </div>
          ) : (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 18,
                padding: "18px 0",
                borderBottom: idx < rows.length - 1 ? "1px solid rgba(10,10,10,.14)" : "none",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: CAT_COLOR[row.cat],
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "Oswald",
                  fontWeight: 700,
                  fontSize: 38,
                  color: DEEP,
                  width: 130,
                  flexShrink: 0,
                }}
              >
                {row.time}
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: 780 }}>
                <div
                  style={{
                    fontFamily: "Oswald",
                    fontWeight: 600,
                    fontSize: 37,
                    color: INK,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {row.title}
                </div>
                <div
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: 28,
                    color: MUTED,
                  }}
                >
                  {row.venue}
                </div>
              </div>
            </div>
          ),
        )}
        <div style={{ display: "flex", flexDirection: "row", marginTop: 26 }}>
          <div
            style={{
              backgroundColor: AGENDA,
              color: "#ffffff",
              boxShadow: "6px 6px 0 " + INK,
              padding: "16px 30px",
              fontFamily: "Oswald",
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: 2.4,
              textTransform: "uppercase",
            }}
          >
            Agenda completa {">"}
          </div>
        </div>
      </div>

      {/* Footer ink: frase itálica + logo blanco */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 1080,
          height: 340,
          backgroundColor: INK,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 40,
          gap: 40,
        }}
      >
        <div
          style={{
            fontStyle: "italic",
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 52,
            color: "#ffffff",
            marginLeft: 30,
            marginRight: 30,
          }}
        >
          ¿Ya tenés planes para hoy?
        </div>
        <img src={logoWhiteDataUrl} style={{ height: 140 }} />
      </div>
    </Fondo>
  );
}

/* ============================================================
 *  VARIANTES FEED 4:5 (1080×1350) — carrusel feed IG/FB
 * ============================================================ */

const FEED_W = 1080;
const FEED_H = 1350;

/** DatePill compacto para feed. */
function DatePillFeed({ num, dia }: { num: string; dia: string }): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        left: 30,
        backgroundColor: PAPER,
        boxShadow: "0 0 0 3px " + INK,
        padding: "9px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Oswald",
          fontWeight: 700,
          fontSize: 34,
          color: DEEP,
          lineHeight: 1,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: INK,
          marginTop: 3,
        }}
      >
        {dia}
      </div>
    </div>
  );
}

/** Placa de evento 4:5: hero 760px + gradiente 130 + body paper 460. */
function EventoFeed({ ev, imageDataUrl }: { ev: Ev; imageDataUrl: string | null }): React.ReactElement {
  const catColor = CAT_COLOR[ev.cat];
  return (
    <div
      style={{
        width: FEED_W,
        height: FEED_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
        display: "flex",
      }}
    >
      {/* Hero imagen */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: FEED_W,
          height: 900,
          backgroundColor: catColor,
          display: "flex",
        }}
      >
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            style={{ position: "absolute", top: 0, left: 0, width: FEED_W, height: 900, objectFit: "cover" }}
          />
        )}
      </div>

      {/* Barra rosa */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: FEED_W,
          height: 10,
          backgroundColor: AGENDA,
        }}
      />

      <DatePillFeed num="12" dia="Sábado" />

      {/* Bloque inferior: gradiente + body */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: FEED_W,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: FEED_W,
            height: 130,
            background: "linear-gradient(to top, rgba(253,251,247,1), rgba(253,251,247,0))",
          }}
        />
        <div
          style={{
            width: FEED_W,
            minHeight: 460,
            backgroundColor: PAPER,
            padding: "22px 44px 30px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Chips */}
          <div style={{ display: "flex", flexDirection: "row", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div
              style={{
                backgroundColor: catColor,
                color: "#ffffff",
                padding: "5px 12px",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "Oswald",
              }}
            >
              {CAT_LABEL[ev.cat]}
            </div>
            <div
              style={{
                backgroundColor: PAPER,
                boxShadow: "0 0 0 3px " + INK,
                padding: "5px 12px",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "Oswald",
                color: INK,
              }}
            >
              {ev.time}
            </div>
            <PriceChip price={ev.price} free={ev.free} />
          </div>

          {/* Título */}
          <div
            style={{
              fontFamily: "Oswald",
              fontWeight: 700,
              fontSize: 44,
              lineHeight: 1.1,
              color: INK,
              marginBottom: 12,
            }}
          >
            {ev.title}
          </div>

          {/* Datos clave */}
          <div
            style={{
              boxShadow: "0 0 0 3px " + INK,
              backgroundColor: CREAM,
              padding: "14px 20px",
              marginBottom: 16,
              display: "flex",
              flexDirection: "row",
              gap: 22,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", width: 300 }}>
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: MUTED,
                  fontFamily: "Oswald",
                  marginBottom: 4,
                }}
              >
                Fecha y hora
              </div>
              <div style={{ fontSize: 31, fontWeight: 600, fontFamily: "Oswald", color: INK }}>
                Sábado 12 · {ev.time}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: MUTED,
                  fontFamily: "Oswald",
                  marginBottom: 4,
                }}
              >
                Lugar
              </div>
              <div
                style={{
                  fontSize: 31,
                  fontWeight: 600,
                  fontFamily: "Oswald",
                  color: INK,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {ev.venue}
              </div>
              <div style={{ fontSize: 26, color: MUTED, marginTop: 0 }}>{ev.city}</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div
              style={{
                backgroundColor: AGENDA,
                color: "#ffffff",
                boxShadow: "5px 5px 0 " + INK,
                padding: "12px 24px",
                fontFamily: "Oswald",
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Más en agenda {">"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Listado 4:5: header ink compacto + lista paper + footer ink con logo y CTA. */
function ListadoFeed({ logoWhiteDataUrl }: { logoWhiteDataUrl: string }): React.ReactElement {
  type Row = { kind: "ev"; time: string; title: string; venue: string; cat: string } | { kind: "sep"; label: string };
  const rows: Row[] = [];
  LISTADO.forEach((e, i) => {
    if (e.dayLabel && (i === 0 || LISTADO[i - 1].dayLabel !== e.dayLabel)) {
      rows.push({ kind: "sep", label: e.dayLabel });
    }
    rows.push({ kind: "ev", time: e.time, title: e.title, venue: e.venue, cat: e.cat });
  });
  return (
    <div
      style={{
        width: FEED_W,
        height: FEED_H,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: INK,
        display: "flex",
      }}
    >
      {/* Barra rosa */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: FEED_W,
          height: 10,
          backgroundColor: AGENDA,
        }}
      />

      {/* Header ink compacto: top 10, height 190 */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 44,
          width: 992,
          height: 190,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 18,
            fontFamily: "Oswald",
            fontWeight: 700,
            fontSize: 60,
            lineHeight: 1.05,
          }}
        >
          <div style={{ color: AGENDA }}>AGENDA</div>
          <div style={{ color: "#ffffff" }}>TUCUMANA</div>
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 24,
            color: "#c9c2b4",
            marginTop: 10,
            textTransform: "capitalize",
          }}
        >
          sábado 12 de septiembre · Tucumán
        </div>
      </div>

      {/* Lista paper: top 200, height 1000 */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          width: FEED_W,
          height: 1000,
          backgroundColor: PAPER,
          padding: "22px 44px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {rows.map((row, idx) =>
          row.kind === "sep" ? (
            <div
              key={`sep-${idx}`}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "18px 0",
                borderBottom: idx < rows.length - 1 ? "1px solid rgba(10,10,10,.14)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "Oswald",
                  fontWeight: 600,
                  fontSize: 20,
                  color: MUTED,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {row.label}
              </div>
            </div>
          ) : (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: "21px 0",
                borderBottom: idx < rows.length - 1 ? "1px solid rgba(10,10,10,.14)" : "none",
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  backgroundColor: CAT_COLOR[row.cat],
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "Oswald",
                  fontWeight: 700,
                  fontSize: 29,
                  color: DEEP,
                  width: 104,
                  flexShrink: 0,
                }}
              >
                {row.time}
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: 800 }}>
                <div
                  style={{
                    fontFamily: "Oswald",
                    fontWeight: 600,
                    fontSize: 28,
                    color: INK,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {row.title}
                </div>
                <div
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: 21,
                    color: MUTED,
                  }}
                >
                  {row.venue}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Footer ink compacto: logo + CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: FEED_W,
          height: 140,
          backgroundColor: INK,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 44px",
        }}
      >
        <img src={logoWhiteDataUrl} style={{ height: 72 }} />
        <div
          style={{
            backgroundColor: AGENDA,
            color: "#ffffff",
            boxShadow: "5px 5px 0 " + "#f5efe4",
            padding: "12px 24px",
            fontFamily: "Oswald",
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Agenda completa {">"}
        </div>
      </div>
    </div>
  );
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = url.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn(`imagen falló (${url}):`, String(err).slice(0, 120));
    return null;
  }
}

async function main() {
  mkdirSync("scripts/out", { recursive: true });
  const fonts = await loadFonts();

  // 3 placas de evento (skip con ONLY_LISTADO=1 para evitar locks del visor)
  if (!process.env.ONLY_LISTADO) {
    for (const ev of EVENTOS) {
      const dataUrl = await toDataUrl(ev.image);
      const el = <EventCard ev={ev} imageDataUrl={dataUrl} />;
      const png = await render(el, { width: STORY_W, height: STORY_H, fonts });
      writeFileSync(`scripts/out/agenda-modal-${ev.name}.png`, Buffer.from(png));
      console.log(`agenda-modal-${ev.name}.png OK`);
    }
  }

  // Placa listado
  const logoBuf = readFileSync(join(__dirname, "..", "public", "logo", "logo-white.png"));
  const logoWhiteDataUrl = `data:image/png;base64,${logoBuf.toString("base64")}`;
  const elListado = <Listado logoWhiteDataUrl={logoWhiteDataUrl} />;
  const pngListado = await render(elListado, { width: STORY_W, height: STORY_H, fonts });
  writeFileSync("scripts/out/agenda-modal-4-listado.png", Buffer.from(pngListado));
  console.log("agenda-modal-4-listado.png OK");

  // Variantes feed 4:5 (skip con ONLY_STORIES=1)
  if (!process.env.ONLY_STORIES) {
    for (const ev of EVENTOS) {
      const dataUrl = await toDataUrl(ev.image);
      const el = <EventoFeed ev={ev} imageDataUrl={dataUrl} />;
      const png = await render(el, { width: FEED_W, height: FEED_H, fonts });
      writeFileSync(`scripts/out/agenda-feed-${ev.name}.png`, Buffer.from(png));
      console.log(`agenda-feed-${ev.name}.png OK`);
    }
    const elFeedListado = <ListadoFeed logoWhiteDataUrl={logoWhiteDataUrl} />;
    const pngFeedListado = await render(elFeedListado, { width: FEED_W, height: FEED_H, fonts });
    writeFileSync("scripts/out/agenda-feed-4-listado.png", Buffer.from(pngFeedListado));
    console.log("agenda-feed-4-listado.png OK");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});