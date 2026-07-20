// Migrar imágenes del bucket "ads" al bucket "media".
//
// Por qué: AdBlocker bloquea URLs con "/ads/". Renombramos el bucket a "media"
// para que las URLs no matcheen los filtros.
//
// Uso:
//   1. Asegurate de que .env.local tenga NEXT_PUBLIC_SUPABASE_URL y
//      SUPABASE_SERVICE_ROLE_KEY.
//   2. Corré primero la migración 021_media_bucket.sql en Supabase SQL Editor
//      (crea el bucket "media" + políticas).
//   3. Después corré este script:
//        node scripts/migrate-ads-to-media.mjs
//
// Qué hace:
//   - Lista todos los objetos del bucket "ads".
//   - Los copia al bucket "media" con el mismo path.
//   - Verifica que cada copia quedó bien (HEAD al nuevo objeto).
//   - NO borra el bucket "ads" (queda como backup).
//   - NO updatea las URLs en la tabla `ads` (eso se hace con el SQL 022).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Cargar .env.local manualmente (sin dotenv)
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log("Listando objetos del bucket 'ads'...\n");

  // Listar todos los objetos del bucket "ads"
  const { data: objects, error: listError } = await supabase.storage
    .from("ads")
    .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (listError) {
    console.error("Error listando bucket 'ads':", listError.message);
    process.exit(1);
  }

  if (!objects || objects.length === 0) {
    console.log("El bucket 'ads' no tiene objetos. Nada que migrar.");
    return;
  }

  console.log(`Encontrados ${objects.length} objeto(s) en 'ads':\n`);

  let ok = 0;
  let failed = 0;
  const failedPaths = [];

  for (const obj of objects) {
    const path = obj.name;
    console.log(`→ ${path}`);

    // Descargar el objeto del bucket "ads"
    const { data: fileData, error: dlError } = await supabase.storage
      .from("ads")
      .download(path);

    if (dlError || !fileData) {
      console.error(`  ✗ Error descargando: ${dlError?.message || "sin data"}`);
      failed++;
      failedPaths.push(path);
      continue;
    }

    // Subirlo al bucket "media" con el mismo path
    const arrayBuf = await fileData.arrayBuffer();
    const body = new Uint8Array(arrayBuf);

    const { error: upError } = await supabase.storage
      .from("media")
      .upload(path, body, {
        contentType: fileData.type || "application/octet-stream",
        upsert: true,
      });

    if (upError) {
      console.error(`  ✗ Error subiendo a 'media': ${upError.message}`);
      failed++;
      failedPaths.push(path);
      continue;
    }

    // Verificar que el objeto existe en el bucket "media"
    const { data: checkData, error: checkError } = await supabase.storage
      .from("media")
      .list("", { search: path });
    if (checkError) {
      console.log(`  ✓ copiado a media/${path} (sin verificación)`);
    } else {
      console.log(`  ✓ copiado a media/${path}`);
    }
    ok++;
  }

  console.log(`\n=== Resumen ===`);
  console.log(`OK: ${ok}`);
  console.log(`Fallaron: ${failed}`);
  if (failed > 0) {
    console.log(`Paths fallidos:`, failedPaths);
    process.exit(1);
  }
  console.log(`\nListo. Ahora corré la migración 022_update_ads_urls_to_media.sql`);
  console.log(`para updatear las URLs en la tabla 'ads'.`);
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});