"use server";

import { createClient, requireAdminAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleAdActive(adId: string, currentActive: boolean) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ads")
    .update({ active: !currentActive })
    .eq("id", adId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/clients/[id]");
  revalidatePath("/admin");
  return { error: null };
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function saveAd(prevState: { error: string } | null, formData: FormData) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const isEditing = !!id;

  // Handle image uploads
  let imageUrl: string | null = null;
  const imageFile = formData.get("image_file") as File | null;
  if (imageFile && imageFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      return { error: "Tipo de imagen no permitido. Solo JPG, PNG, WebP, GIF." };
    }
    if (imageFile.size > MAX_FILE_SIZE) {
      return { error: "La imagen no puede superar 5MB." };
    }
    const ext = imageFile.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("media").upload(path, imageFile, { upsert: true });
    if (uploadError) return { error: "Error al subir imagen: " + uploadError.message };
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    imageUrl = urlData.publicUrl;
  } else if (isEditing) {
    imageUrl = formData.get("existing_image_url") as string | null;
  }

  let mobileImageUrl: string | null = null;
  const mobileFile = formData.get("mobile_image_file") as File | null;
  if (mobileFile && mobileFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(mobileFile.type)) {
      return { error: "Tipo de imagen mobile no permitido. Solo JPG, PNG, WebP, GIF." };
    }
    if (mobileFile.size > MAX_FILE_SIZE) {
      return { error: "La imagen mobile no puede superar 5MB." };
    }
    const ext = mobileFile.name.split(".").pop();
    const path = `${Date.now()}-mobile-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("media").upload(path, mobileFile, { upsert: true });
    if (uploadError) return { error: "Error al subir imagen mobile: " + uploadError.message };
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    mobileImageUrl = urlData.publicUrl;
  } else if (isEditing) {
    mobileImageUrl = formData.get("existing_mobile_image_url") as string | null;
  }

  const payload = {
    title: (formData.get("title") as string) || null,
    type: formData.get("type") as string,
    section: (formData.get("section") as string) || null,
    client_id: (formData.get("client_id") as string) || null,
    link_url: (formData.get("link_url") as string) || null,
    image_url: imageUrl,
    mobile_image_url: mobileImageUrl,
    active: formData.get("active") === "on",
    priority: Number(formData.get("priority") || 0),
    display_duration: Number(formData.get("display_duration") || 15),
    starts_at: (formData.get("starts_at") as string) || null,
    expires_at: (formData.get("expires_at") as string) || null,
  };

  if (isEditing) {
    const { error } = await supabase.from("ads").update(payload).eq("id", id!);
    if (error) return { error: "Error al actualizar: " + error.message };
  } else {
    const { error } = await supabase.from("ads").insert(payload);
    if (error) return { error: "Error al crear: " + error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients/[id]");
  return { error: null };
}