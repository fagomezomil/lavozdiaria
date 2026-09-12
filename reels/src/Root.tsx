import { Composition } from "remotion";
import { calculateReelMetadata, Reel, reelSchema } from "./Reel";

/** 30fps · 1080x1920 · duración dinámica (calculateReelMetadata).
 *  Los defaultProps son placeholder para el Studio: el render real recibe
 *  inputProps desde build-reel.mjs (segmentos TTS + duraciones reales). */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      fps={30}
      width={1080}
      height={1920}
      schema={reelSchema}
      calculateMetadata={calculateReelMetadata}
      defaultProps={{
        fecha: "Viernes 12.09",
        musica: "musica.mp3",
        musicVolume: 0.12,
        gapFrames: 9,
        intro: { audio: "audio-final.mp3", durFrames: 105 },
        notas: [
          {
            chip: "Tucumán",
            color: "#f59e0b",
            titular: "Hallaron una finca con 500 plantas de marihuana",
            sub: "Allanamiento de Drogas Peligrosas Oeste en la noche del viernes.",
            layout: "fullbleed" as const,
            image: "https://pub-7d90620b77a845bcbb1bf3fee8f467a2.r2.dev/articles/comunicaciontucuman/97d90b3e0797.webp",
            audio: "",
            durFrames: 210,
          },
          {
            chip: "Deportes",
            color: "#3b82f6",
            titular: "Talleres - Unión cierra la fecha del sábado",
            sub: "Zona A, 20:00, con arbitraje de Nazareno Arasa.",
            layout: "banda" as const,
            image: "https://pub-7d90620b77a845bcbb1bf3fee8f467a2.r2.dev/articles/afa/d6af8fce0ce6.webp",
            audio: "",
            durFrames: 210,
          },
          {
            chip: "Espectáculos",
            color: "#ec4899",
            titular: "Marta Fort oficializó su noviazgo y viajó a Mendoza",
            sub: "Lo confirmaron en Blender at Night y partieron acompañados de una amiga.",
            layout: "fullbleed" as const,
            image: "https://pub-7d90620b77a845bcbb1bf3fee8f467a2.r2.dev/articles/infobae/d35652076c97.webp",
            audio: "",
            durFrames: 210,
          },
        ],
        cierre: { audio: "audio-final.mp3", durFrames: 150 },
      }}
    />
  );
};