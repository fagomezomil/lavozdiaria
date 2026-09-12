import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** POST /api/push/subscribe — guarda la suscripción Web Push del lector.
 *  Body: { endpoint, keys: { p256dh, auth } } (formato PushSubscription del browser).
 *  Upsert por endpoint (único). Rate limit 10/min en proxy.ts. */
export async function POST(request: NextRequest) {
  let body: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : null;
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : null;

  if (!endpoint || !p256dh || !auth || !endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  const admin = await getSupabaseAdmin();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      endpoint,
      p256dh,
      auth,
      user_agent: request.headers.get("user-agent"),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("push subscribe error:", error.message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}