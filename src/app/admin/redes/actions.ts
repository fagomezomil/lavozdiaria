"use server";

import { createClient, requireAdminAction } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { buildCarousel } from "@/lib/social/carousel-builder";
import { bufferPublish } from "@/lib/social/buffer-client";
import { AGENDA_COLORS, AGENDA_LABELS } from "@/lib/social/slide-template";
import { buildEventCaption } from "@/lib/social/caption-builder";
import type { ChannelTarget } from "@/lib/social/daily-limits";

/** Reintento manual: regenera los slides del post y republica via Buffer.
 *  Conserva el article_ids original del registro. */
export async function retrySocialPost(postId: string) {
  await requireAdminAction();

  const admin = await getSupabaseAdmin();
  const { data: post } = await admin
    .from("social_posts")
    .select("article_ids, sections")
    .eq("id", postId)
    .single();

  if (!post) throw new Error("Post no encontrado");

  const ids = (post.article_ids as (string | null)[]).filter(
    (id): id is string => id !== null,
  );
  if (ids.length === 0) throw new Error("El post no tiene article_ids");

  const { data: rows } = await admin
    .from("articles")
    .select("id, title, section, image_url, original_url, excerpt, created_at")
    .in("id", ids);

  if (!rows || rows.length === 0) throw new Error("No se encontraron las notas originales");

  const byId = new Map(rows.map((r) => [r.id, r]));
  const orderedNotes = ids.map((id) => byId.get(id) ?? null);

  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const timestamp = Date.now();
  const turno = since.getHours() < 14 ? "mañana" : "noche";

  const formatDateLabel = (iso: string): string => {
    try {
      const d = new Date(iso);
      return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
    } catch {
      return "";
    }
  };

  const slideUrls: string[] = [];
  for (const note of orderedNotes) {
    if (!note) continue;
    try {
      const { generateSlidePng } = await import("@/lib/social/generate-slide");
      const png = await generateSlidePng({
        title: note.title,
        section: note.section,
        imageDataUrl: note.image_url ?? "",
        excerpt: note.excerpt ?? undefined,
        dateLabel: formatDateLabel(note.created_at),
      });
      const path = `social/retry-${timestamp}-${note.section}.png`;
      const { error: upErr } = await admin.storage.from("media").upload(path, png, {
        contentType: "image/png",
        upsert: true,
      });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
      const { data: urlData } = admin.storage.from("media").getPublicUrl(path);
      slideUrls.push(urlData.publicUrl);
    } catch (err) {
      console.error(`retry slide ${note.section}:`, err);
    }
  }

  if (slideUrls.length === 0) throw new Error("No se pudieron regenerar los slides");

  const { buildCaption } = await import("@/lib/social/caption-builder");
  const caption = buildCaption(
    orderedNotes.map((n) =>
      n
        ? {
            id: n.id,
            title: n.title,
            section: n.section,
            image_url: n.image_url,
            original_url: n.original_url,
            excerpt: n.excerpt,
            created_at: n.created_at,
          }
        : null,
    ),
    turno as "mañana" | "noche",
  );

  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  const channelIds = (process.env.BUFFER_CHANNEL_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const result = await bufferPublish(bufferKey, channelIds, caption, slideUrls);
  const newStatus = result.success ? "published" : "failed";
  const bufferUpdateIds = (result.channelTargets ?? [])
    .map((t) => t.postId)
    .filter((id): id is string => id !== null);

  await admin
    .from("social_posts")
    .update({
      status: newStatus,
      slide_image_urls: slideUrls,
      caption,
      channel_targets: result.channelTargets ?? [],
      buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
      error_message: result.success ? null : result.error ?? null,
      published_at: result.success ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  revalidatePath("/admin/redes");
  return { success: result.success, error: result.error };
}

/** Disparar manualmente una generación nueva (dry-run: guarda sin publicar). */
export async function triggerNewPostDryRun() {
  await requireAdminAction();
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const carousel = await buildCarousel(since);

  if (carousel.slideImageUrls.length === 0) {
    return { success: false, error: "Sin notas para publicar" };
  }

  const admin = await getSupabaseAdmin();
  const { error } = await admin.from("social_posts").insert({
    status: "pending",
    article_ids: carousel.articleIds,
    sections: carousel.sections,
    slide_image_urls: carousel.slideImageUrls,
    caption: carousel.caption,
    channel_targets: [],
    buffer_update_ids: null,
    error_message: "Generado en dry-run — pendiente de publicación manual o cron",
  });

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath("/admin/redes");
  return { success: true, slides: carousel.slideImageUrls.length };
}

/** Publicar ahora mismo a Buffer (real, no dry-run). Genera slides y manda a los canales. */
export async function publishNow() {
  await requireAdminAction();
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const carousel = await buildCarousel(since);

  if (carousel.slideImageUrls.length === 0) {
    return { success: false, error: "Sin notas para publicar" };
  }

  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  const channelIds = (process.env.BUFFER_CHANNEL_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!bufferKey) {
    const admin = await getSupabaseAdmin();
    await admin.from("social_posts").insert({
      status: "pending",
      article_ids: carousel.articleIds,
      sections: carousel.sections,
      slide_image_urls: carousel.slideImageUrls,
      caption: carousel.caption,
      channel_targets: [],
      error_message: "BUFFER_API_KEY no configurada",
    });
    return { success: false, error: "Falta BUFFER_API_KEY en .env.local" };
  }

  const result = await bufferPublish(bufferKey, channelIds, carousel.caption, carousel.slideImageUrls);
  const status: "published" | "failed" = result.success ? "published" : "failed";
  const bufferUpdateIds = (result.channelTargets ?? [])
    .map((t) => t.postId)
    .filter((id): id is string => id !== null);

  const admin = await getSupabaseAdmin();
  const { error } = await admin.from("social_posts").insert({
    status,
    article_ids: carousel.articleIds,
    sections: carousel.sections,
    slide_image_urls: carousel.slideImageUrls,
    caption: carousel.caption,
    channel_targets: result.channelTargets ?? [],
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: result.success ? null : result.error ?? null,
    published_at: result.success ? new Date().toISOString() : null,
  });

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath("/admin/redes");
  return {
    success: result.success,
    slides: carousel.slideImageUrls.length,
    skippedByLimit: result.skippedByLimit ?? [],
    error: result.success ? undefined : result.error,
  };
}

/** Publica 1 nota específica a los canales seleccionados.
 *  - articleId: nota a publicar (genera 1 slide)
 *  - channelIds: canales destino (si vacío, todos los conectados)
 *  - scheduledAt: ISO string — si viene, programa para esa fecha (customScheduled);
 *    si no, publica en el instante (shareNow). */
export async function publishArticle(
  articleId: string,
  channelIds: string[],
  scheduledAt?: string,
) {
  await requireAdminAction();
  if (!articleId) return { success: false, error: "Falta articleId" };

  const admin = await getSupabaseAdmin();
  const { data: article } = await admin
    .from("articles")
    .select("id, title, section, image_url, original_url, excerpt, created_at")
    .eq("id", articleId)
    .single();

  if (!article) return { success: false, error: "Nota no encontrada" };

  const formatDateLabel = (iso: string): string => {
    try {
      const d = new Date(iso);
      return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
    } catch {
      return "";
    }
  };

  // Generar 1 slide para la nota
  let slideUrl: string | null = null;
  try {
    const { generateSlidePng } = await import("@/lib/social/generate-slide");
    const png = await generateSlidePng({
      title: article.title,
      section: article.section,
      imageDataUrl: article.image_url ?? "",
      excerpt: article.excerpt ?? undefined,
      dateLabel: formatDateLabel(article.created_at),
    });
    const path = `social/manual-${Date.now()}-${article.section}.png`;
    const { error: upErr } = await admin.storage.from("media").upload(path, png, {
      contentType: "image/png",
      upsert: true,
    });
    if (upErr) throw new Error(`upload: ${upErr.message}`);
    const { data: urlData } = admin.storage.from("media").getPublicUrl(path);
    slideUrl = urlData.publicUrl;
  } catch (err) {
    console.error("publishArticle slide:", err);
    return { success: false, error: `No se pudo generar el slide: ${String(err)}` };
  }

  // Caption con 1 sola nota
  const { buildCaption } = await import("@/lib/social/caption-builder");
  const turno = new Date().getHours() < 14 ? "mañana" : "noche";
  const caption = buildCaption(
    [
      {
        id: article.id,
        title: article.title,
        section: article.section,
        image_url: article.image_url,
        original_url: article.original_url,
        excerpt: article.excerpt,
        created_at: article.created_at,
      },
    ],
    turno,
  );

  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  if (!bufferKey) {
    return { success: false, error: "Falta BUFFER_API_KEY en .env.local" };
  }

  const scheduled = scheduledAt ? new Date(scheduledAt) : undefined;
  const result = await bufferPublish(bufferKey, channelIds, caption, [slideUrl], scheduled);
  const status: "published" | "failed" = result.success ? "published" : "failed";
  const bufferUpdateIds = (result.channelTargets ?? [])
    .map((t) => t.postId)
    .filter((id): id is string => id !== null);

  const { error } = await admin.from("social_posts").insert({
    status,
    article_ids: [article.id],
    sections: [article.section],
    slide_image_urls: [slideUrl],
    caption,
    channel_targets: result.channelTargets ?? [],
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: result.success ? null : result.error ?? null,
    published_at: result.success ? new Date().toISOString() : null,
    scheduled_at: scheduled ? scheduled.toISOString() : new Date().toISOString(),
  });

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath("/admin/redes");
  return {
    success: result.success,
    skippedByLimit: result.skippedByLimit ?? [],
    error: result.success ? undefined : result.error,
  };
}

/** Publica 1 evento de agenda a los canales seleccionados.
 *  - eventId: evento a publicar (genera 1 slide con chip categoría + venue)
 *  - channelIds: canales destino (si vacío, todos los conectados)
 *  - scheduledAt: ISO string — si viene, programa para esa fecha; si no, shareNow. */
export async function publishEvent(
  eventId: string,
  channelIds: string[],
  scheduledAt?: string,
) {
  await requireAdminAction();
  if (!eventId) return { success: false, error: "Falta eventId" };

  const admin = await getSupabaseAdmin();
  const { data: event } = await admin
    .from("events")
    .select(
      "id, title, category, date_iso, date_label_num, date_label_name, time, venue_name, image_url, excerpt, created_at",
    )
    .eq("id", eventId)
    .single();

  if (!event) return { success: false, error: "Evento no encontrado" };

  // Etiqueta de fecha: usa date_iso formateada DD/MM/YYYY
  const formatDateLabel = (iso: string | null): string => {
    if (!iso) return "";
    try {
      const d = new Date(iso + "T00:00:00Z");
      return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
    } catch {
      return "";
    }
  };
  const dateLabel = formatDateLabel(event.date_iso);
  const catLabel = AGENDA_LABELS[event.category] ?? event.category;
  const catColor = AGENDA_COLORS[event.category] ?? "#6b5d4f";

  // Generar 1 slide para el evento
  let slideUrl: string | null = null;
  try {
    const { generateSlidePng } = await import("@/lib/social/generate-slide");
    const png = await generateSlidePng({
      title: event.title,
      // section obligatoria del tipo — usamos "tucuman" como placeholder, el chip override lo reemplaza
      section: "tucuman",
      imageDataUrl: event.image_url ?? "",
      excerpt: event.excerpt ?? undefined,
      dateLabel,
      chip: { label: catLabel, color: catColor },
      venue: event.venue_name ?? undefined,
    });
    const path = `social/event-${Date.now()}-${event.category}.png`;
    const { error: upErr } = await admin.storage.from("media").upload(path, png, {
      contentType: "image/png",
      upsert: true,
    });
    if (upErr) throw new Error(`upload: ${upErr.message}`);
    const { data: urlData } = admin.storage.from("media").getPublicUrl(path);
    slideUrl = urlData.publicUrl;
  } catch (err) {
    console.error("publishEvent slide:", err);
    return { success: false, error: `No se pudo generar el slide: ${String(err)}` };
  }

  // Caption con 1 solo evento
  const caption = buildEventCaption({
    title: event.title,
    category: event.category,
    venueName: event.venue_name ?? null,
    dateLabel: dateLabel || null,
    excerpt: event.excerpt ?? null,
  });

  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  if (!bufferKey) {
    return { success: false, error: "Falta BUFFER_API_KEY en .env.local" };
  }

  const scheduled = scheduledAt ? new Date(scheduledAt) : undefined;
  const result = await bufferPublish(bufferKey, channelIds, caption, [slideUrl], scheduled);
  const status: "published" | "failed" = result.success ? "published" : "failed";
  const bufferUpdateIds = (result.channelTargets ?? [])
    .map((t) => t.postId)
    .filter((id): id is string => id !== null);

  const { error } = await admin.from("social_posts").insert({
    status,
    kind: "evento",
    article_ids: [event.id],
    sections: [event.category],
    slide_image_urls: [slideUrl],
    caption,
    channel_targets: result.channelTargets ?? [],
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: result.success ? null : result.error ?? null,
    published_at: result.success ? new Date().toISOString() : null,
    scheduled_at: scheduled ? scheduled.toISOString() : new Date().toISOString(),
  });

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath("/admin/redes");
  return {
    success: result.success,
    skippedByLimit: result.skippedByLimit ?? [],
    error: result.success ? undefined : result.error,
  };
}

/** Elimina un registro de social_posts (sólo admin). */
export async function deleteSocialPost(postId: string) {
  await requireAdminAction();
  const supabase = await createClient();
  const { error } = await supabase.from("social_posts").delete().eq("id", postId);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
  revalidatePath("/admin/redes");
}