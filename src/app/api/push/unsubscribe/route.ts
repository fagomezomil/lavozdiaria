import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** POST /api/push/unsubscribe — borra la suscripción (el usuario desactivó avisos).
 *  Body: { endpoint }. Service role: solo borra por endpoint exacto. */
export async function POST(request: NextRequest) {
  let body: { endpoint?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;
  if (!endpoint) {
    return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });
  }

  const admin = await getSupabaseAdmin();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    console.error("push unsubscribe error:", error.message);
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}