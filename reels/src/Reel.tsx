import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  continueRender,
  delayRender,
  staticFile,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { INTER, OSWALD } from "./fonts";

// El JSX usa oswald.family / inter.family (API de @remotion/google-fonts).
const oswald = { family: OSWALD };
const inter = { family: INTER };

/* ============ tipos ============ */

export const notaSchema = z.object({
  chip: z.string(),
  color: z.string(),
  titular: z.string(),
  sub: z.string(),
  layout: z.enum(["fullbleed", "banda", "dato"]),
  image: z.string().url().nullable().optional(),
  /** Segmento TTS de esta nota (staticFile) + duración en frames. */
  audio: z.string().optional(),
  durFrames: z.number().int().optional(),
});

export const reelSchema = z.object({
  fecha: z.string(),
  /** Música de fondo en loop (staticFile), volumen fijo con fade final. */
  musica: z.string(),
  musicVolume: z.number().default(0.12),
  intro: z.object({ audio: z.string(), durFrames: z.number().int() }),
  notas: z.array(notaSchema).min(1).max(8),
  cierre: z.object({ audio: z.string(), durFrames: z.number().int() }),
  /** Frames de separación entre escenas. */
  gapFrames: z.number().int().default(9),
});

export type ReelProps = z.infer<typeof reelSchema>;
type Nota = z.infer<typeof notaSchema>;

/** Duración total: intro + notas (+gaps) + cierre. Usado por la Composition. */
export const totalDurFrames = (props: ReelProps): number => {
  const g = props.gapFrames;
  return (
    props.intro.durFrames +
    props.notas.reduce((acc, n) => acc + (n.durFrames ?? 180) + g, 0) +
    props.cierre.durFrames
  );
};

export const calculateReelMetadata: CalculateMetadataFunction<ReelProps> = ({ props }) => {
  return { durationInFrames: totalDurFrames(props) };
};

/* ============ helpers ============ */

const COLORS = {
  ink: "#0a0a0a",
  cream: "#f5efe4",
  paper: "#fdfbf7",
  brand: "#f97316",
};

/** halftone dots overlay (estética Comic Noir). */
const halftone: React.CSSProperties = {
  backgroundImage: `radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1.4px)`,
  backgroundSize: "14px 14px",
};

/** Foto de la nota (R2) con ken burns, o placeholder de gradientes si no hay. */
const NotaFoto: React.FC<{ src?: string | null; seed: number; kb: number }> = ({
  src,
  seed,
  kb,
}) => {
  if (src) {
    return (
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${kb})`,
        }}
      />
    );
  }
  return <FotoPlaceholder seed={seed} kb={kb} />;
};

/** Placeholder de foto: gradientes superpuestos + halftone (sin imagen). */
const FotoPlaceholder: React.FC<{ seed: number; kb: number }> = ({ seed, kb }) => {
  const hue = 20 + seed * 25;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${kb})`,
        background: `
          radial-gradient(circle at ${60 + seed * 7}% ${22 + seed * 12}%, hsl(${hue} 22% 38%) 0 18%, transparent 48%),
          radial-gradient(circle at ${30 - seed * 4}% ${62 - seed * 6}%, hsl(${hue + 14} 18% 26%) 0 30%, transparent 62%),
          linear-gradient(160deg, hsl(${hue} 16% 24%), #141210)`,
      }}
    >
      <AbsoluteFill style={halftone} />
    </AbsoluteFill>
  );
};

/** ken burns: scale 1 → 1.15 durante la escena. */
const useKenBurns = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, durationInFrames], [1, 1.15], {
    extrapolateRight: "clamp",
  });
};

/** fade in/out de la escena completa. */
const SceneFade: React.FC<{ children: React.ReactNode; dur: number }> = ({
  children,
  dur,
}) => {
  const frame = useCurrentFrame();
  const opacity =
    interpolate(frame, [0, 8, Math.max(dur - 8, 10), dur], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** Audio de un segmento TTS dentro de una Sequence. */
const SegAudio: React.FC<{ src?: string }> = ({ src }) =>
  src ? <Audio src={staticFile(src)} /> : null;

/* ============ escenas ============ */

const Intro: React.FC<{ fecha: string }> = ({ fecha }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
  const barra = interpolate(frame, [14, 55], [0, 260], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={halftone} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
          transform: `scale(${interpolate(pop, [0, 1], [0.8, 1])})`,
        }}
      >
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 92,
            color: COLORS.brand,
            letterSpacing: 2,
          }}
        >
          ¡QUE NOTICIA!
        </div>
        <div style={{ width: barra, height: 10, background: COLORS.brand }} />
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 66,
            color: COLORS.cream,
            textAlign: "center",
            lineHeight: 1.1,
            opacity: interpolate(frame, [20, 34], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          LAS NOTICIAS
          <br />
          DEL DÍA
        </div>
        <div
          style={{
            fontFamily: inter.family,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 8,
            color: "rgba(245,239,228,0.65)",
            textTransform: "uppercase",
            opacity: interpolate(frame, [32, 46], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {fecha} · Tucumán
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const NotaFullbleed: React.FC<{ nota: Nota; dur: number; seed: number }> = ({
  nota,
  dur,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kb = useKenBurns(dur);
  const slide = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <NotaFoto src={nota.image} seed={seed} kb={kb} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(transparent 40%, rgba(10,10,10,0.55) 62%, rgba(10,10,10,0.95) 82%)",
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 64px 170px",
          transform: `translateY(${interpolate(slide, [0, 1], [120, 0])}px)`,
          opacity: interpolate(slide, [0, 1], [0, 1]),
        }}
      >
        <Chip label={nota.chip} color={nota.color} delay={14} />
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 74,
            lineHeight: 1.1,
            color: "#fff",
            marginTop: 24,
            textShadow: "6px 6px 0 rgba(10,10,10,0.55)",
          }}
        >
          {nota.titular}
        </div>
        <div
          style={{
            fontFamily: inter.family,
            fontWeight: 400,
            fontSize: 32,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.88)",
            marginTop: 18,
            opacity: interpolate(frame, [26, 40], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {nota.sub}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const NotaBanda: React.FC<{ nota: Nota; dur: number; seed: number }> = ({
  nota,
  dur,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kb = useKenBurns(dur);
  const subio = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: COLORS.cream }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "52%", overflow: "hidden" }}>
        <NotaFoto src={nota.image} seed={seed} kb={kb} />
        <AbsoluteFill style={{ background: "linear-gradient(transparent 70%, rgba(10,10,10,0.35))" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: "52%",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "52px 64px",
          transform: `translateY(${interpolate(subio, [0, 1], [140, 0])}px)`,
          opacity: interpolate(subio, [0, 1], [0, 1]),
        }}
      >
        <Chip label={nota.chip} color={nota.color} delay={12} />
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 68,
            lineHeight: 1.12,
            color: COLORS.ink,
            marginTop: 24,
          }}
        >
          {nota.titular}
        </div>
        <div
          style={{
            fontFamily: inter.family,
            fontWeight: 400,
            fontSize: 34,
            lineHeight: 1.45,
            color: "#3f3a34",
            marginTop: 24,
            opacity: interpolate(frame, [20, 34], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {nota.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const NotaDato: React.FC<{ nota: Nota; dur: number; seed: number }> = ({
  nota,
  dur,
  seed: _seed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 8, fps, config: { damping: 14, mass: 0.7 } });
  return (
    <AbsoluteFill style={{ background: COLORS.brand }}>
      <AbsoluteFill
        style={{
          ...halftone,
          backgroundImage: "radial-gradient(rgba(10,10,10,0.16) 1px, transparent 1.4px)",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 72px", gap: 18 }}>
        <Chip label={nota.chip} color={COLORS.ink} textColor={COLORS.brand} delay={2} />
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 240,
            color: COLORS.ink,
            lineHeight: 1,
            transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])})`,
            transformOrigin: "left center",
          }}
        >
          {nota.titular}
        </div>
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 600,
            fontSize: 48,
            lineHeight: 1.25,
            color: COLORS.ink,
            opacity: interpolate(frame, [26, 40], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {nota.sub}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cierre: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 2, fps, config: { damping: 12, mass: 0.6 } });
  const cta = spring({ frame: frame - 18, fps, config: { damping: 13, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={halftone} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 62,
            color: COLORS.brand,
            transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
          }}
        >
          ¡QUE NOTICIA!
        </div>
        <div
          style={{
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 72,
            color: COLORS.cream,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          SEGUINOS
          <br />
          @quenoticiaok
        </div>
        <div
          style={{
            background: COLORS.brand,
            color: COLORS.ink,
            fontFamily: oswald.family,
            fontWeight: 700,
            fontSize: 40,
            padding: "16px 44px",
            boxShadow: "10px 10px 0 rgba(0,0,0,0.5)",
            transform: `scale(${interpolate(cta, [0, 1], [0.6, 1])})`,
          }}
        >
          LINK EN LA BIO
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ============ piezas ============ */

const Chip: React.FC<{
  label: string;
  color: string;
  textColor?: string;
  delay?: number;
}> = ({ label, color, textColor = "#fff", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 13, mass: 0.5 } });
  return (
    <div
      style={{
        alignSelf: "flex-start",
        background: color,
        color: textColor,
        fontFamily: oswald.family,
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: 5,
        textTransform: "uppercase",
        padding: "10px 26px",
        transform: `scale(${interpolate(pop, [0, 1], [0, 1])})`,
        transformOrigin: "left center",
        width: "fit-content",
      }}
    >
      {label}
    </div>
  );
};

/** Música de fondo: loop + volumen base + fade out en el tramo final. */
const Musica: React.FC<{ src: string; volume: number; totalDur: number }> = ({
  src,
  volume,
  totalDur,
}) => {
  return (
    <Audio
      src={staticFile(src)}
      loop
      volume={(f) =>
        interpolate(
          f,
          [0, 15, totalDur - 105, totalDur],
          [0, volume, volume, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
    />
  );
};

/* ============ reel ============ */

export const Reel: React.FC<ReelProps> = ({
  fecha,
  musica,
  musicVolume,
  intro,
  notas,
  cierre,
  gapFrames,
}) => {
  const total = totalDurFrames({ fecha, musica, musicVolume, intro, notas, cierre, gapFrames });
  let cursor = intro.durFrames;
  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Musica src={musica} volume={musicVolume} totalDur={total} />

      <Sequence from={0} durationInFrames={intro.durFrames}>
        <SceneFade dur={intro.durFrames}>
          <Intro fecha={fecha} />
        </SceneFade>
        <SegAudio src={intro.audio} />
      </Sequence>

      {notas.map((nota, i) => {
        const from = cursor;
        const dur = nota.durFrames ?? 180;
        cursor = from + dur + gapFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SceneFade dur={dur}>
              {nota.layout === "fullbleed" ? (
                <NotaFullbleed nota={nota} dur={dur} seed={i + 1} />
              ) : nota.layout === "banda" ? (
                <NotaBanda nota={nota} dur={dur} seed={i + 1} />
              ) : (
                <NotaDato nota={nota} dur={dur} seed={i + 1} />
              )}
            </SceneFade>
            <SegAudio src={nota.audio} />
          </Sequence>
        );
      })}

      <Sequence from={cursor} durationInFrames={cierre.durFrames}>
        <SceneFade dur={cierre.durFrames}>
          <Cierre />
        </SceneFade>
        <SegAudio src={cierre.audio} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Utilidad para el bundle entry (usada por build-reel.mjs). */
export { continueRender, delayRender, staticFile };