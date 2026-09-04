/** Test render con NOTAS REALES del Supabase — valida pipeline completo:
 *  select → assignLayout → extractQuote/Stat → generateSlidePng (v2).
 *  No publica a Buffer, sólo genera PNGs.
 *
 *  Correr en VPS:
 *    set -a; source .env.production; set +a
 *    NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/test-real-slides.tsx
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { selectNotesForCarousel, selectNotesForStories } from "@/lib/social/select-notes";
import { generateSlidePng, generateStoryPng } from "@/lib/social/generate-slide";
import { planSlides } from "@/lib/social/extract-slide-content";
import type { SlideDataV2 } from "@/lib/social/slide-template-v2";

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  } catch {
    return "";
  }
}

async function main() {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const excludeIds = new Set<string>();

  console.log("Selecting carrusel notes...");
  const notes = await selectNotesForCarousel(since, excludeIds);
  console.log(`Got ${notes.filter(Boolean).length} notes`);

  const outDir = "/tmp/test-real-slides";
  await mkdir(outDir, { recursive: true });

  const plans = planSlides(
    notes.map((n) => (n ? { body: n.body, image_url: n.image_url, title: n.title } : { body: null, image_url: null, title: "" })),
    { forceLastCta: true },
  );

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (!note || !note.title) {
      console.log(`  [${i}] null note, skipping`);
      continue;
    }
    const plan = plans[i];
    console.log(`  [${i}] ${plan.layout} — ${note.section} — "${note.title.slice(0, 50)}..."`);
    if (plan.layout === "cita") console.log(`       quote: ${plan.quote ? `"${plan.quote.text.slice(0, 50)}..."` : "null (fallback to title)"}`);
    if (plan.layout === "dato") console.log(`       stat: ${plan.stat ? `${plan.stat.value} — ${plan.stat.label.slice(0, 50)}` : "null (fallback to title)"}`);

    const slideData: SlideDataV2 = {
      title: note.title,
      section: note.section,
      imageDataUrl: note.image_url ?? "",
      excerpt: note.excerpt ?? undefined,
      dateLabel: formatDateLabel(note.created_at),
      sourceLabel: note.author ?? undefined,
      layout: plan.layout,
      quote: plan.quote,
      stat: plan.stat,
    };

    try {
      const png = await generateSlidePng(slideData);
      await writeFile(join(outDir, `real-carrusel-${i}-${plan.layout}.png`), Buffer.from(png));
      console.log(`       ✓ carrusel PNG saved`);
    } catch (err) {
      console.error(`       ✗ carrusel failed:`, err);
    }
  }

  // También testear 5 stories
  console.log("\nSelecting story notes...");
  const storyNotes = await selectNotesForStories(since, excludeIds);
  const storySubset = storyNotes.slice(0, 5);
  console.log(`Got ${storySubset.filter(Boolean).length} notes for stories`);

  const storyPlans = planSlides(
    storySubset.map((n) => (n ? { body: n.body, image_url: n.image_url, title: n.title } : { body: null, image_url: null, title: "" })),
  );

  for (let i = 0; i < storySubset.length; i++) {
    const note = storySubset[i];
    if (!note || !note.title) continue;
    const plan = storyPlans[i];
    console.log(`  [${i}] ${plan.layout} — ${note.section}`);

    const slideData: SlideDataV2 = {
      title: note.title,
      section: note.section,
      imageDataUrl: note.image_url ?? "",
      excerpt: note.excerpt ?? undefined,
      dateLabel: formatDateLabel(note.created_at),
      sourceLabel: note.author ?? undefined,
      layout: plan.layout,
      quote: plan.quote,
      stat: plan.stat,
    };

    try {
      const png = await generateStoryPng(slideData);
      await writeFile(join(outDir, `real-story-${i}-${plan.layout}.png`), Buffer.from(png));
      console.log(`       ✓ story PNG saved`);
    } catch (err) {
      console.error(`       ✗ story failed:`, err);
    }
  }

  console.log(`\nListo. PNGs en ${outDir}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});