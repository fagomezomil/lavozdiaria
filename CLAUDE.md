# ¡QUE NOTICIA! — convenciones del proyecto

Medio regional de Tucumán, Argentina. Fede + Adrian. Next.js 16 App Router + Supabase + Tailwind v4.

## Stack
- **Frontend**: Next.js 16 (App Router, server/client components), TypeScript estricto, Tailwind v4 con `@theme inline`.
- **Backend**: Supabase (Postgres + RLS + Storage + Auth). Migraciones en `supabase/migrations/`.
- **Fonts**: Oswald (headings, `--font-heading`), Inter (body, `--font-body`). Cargadas vía `next/font`.
- **Design**: Comic Noir + Naranja. Tokens en `src/app/globals.css` (`:root` + `@theme inline`). Hard shadows, halftone, cream #f5efe4 background, ink #0a0a0a.

## Estructura
- `src/app/` — rutas App Router (público + `/admin/*` + `/api/*`).
- `src/components/` — componentes compartidos. `/admin/*` subcarpeta para admin.
- `src/lib/` — lógica server (`supabase/server.ts` crea cliente con cookies). NO importar en client components (rompe boundary por `next/headers`).
- `src/lib/types.ts` — union `Section` + `sectionConfig` Record. AGREGAR acá cuando una sección nueva exista.
- `supabase/migrations/` — migraciones SQL. 001-019 commiteadas, 020+ **gitignored** (no subir al repo público).

## Secciones (6)
politica, deportes, economia, internacionales, tucuman, **opinion**.

- `sectionConfig` en `src/lib/types.ts` define label, color, path.
- Cada sección tiene página `src/app/{section}/page.tsx` (usa `SectionPageLayout` o layout propio).
- `opinion` es **manual-only**: nunca viene del scraper ni del clasificador automático. Sólo se crea desde `/admin/opinion`. Ver memory `lavozdiaria-opinion-manual-only.md`.

## Scraper (REPO EXTERNO)
**`C:\Users\Fede\Desktop\scraping`** — Python, 5 fuentes (Contexto, Comunicación Tucumán, Comunicación SMT, Ámbito, TyC Sports). Inserta directo en Supabase `articles`. Windows Task Scheduler 2x/día (8:00 y 20:00). Log: `scraper.log`.

- `comunicacionsmt` usa **Playwright** + sitemap.xml desde 2026-07-21 (cloudscraper ya no pasa Cloudflare). Per-source max 4/corrida.
- Ver memory `lavozdiaria-scraper.md` para detalle.
- NO tocar el scraper desde este repo — es un proyecto aparte.

## Comandos
- **Type-check**: `npx tsc --noEmit` (correr antes de commit).
- **Build**: `npx next build` (verificar rutas registradas).
- **Dev**: `npm run dev` (puerto 3000).
- **Migraciones Supabase**: aplicar via SQL editor en dashboard o `supabase db push`.

## Memoria del proyecto
`C:\Users\Fede\.claude\projects\C--Users-Fede-Desktop-lavozdiaria\memory\`
- `MEMORY.md` es el índice (siempre cargado).
- Archivos `.md` individuales con frontmatter (`type: user|feedback|project|reference`).
- Antes de recomendar algo citado en memoria, verificá que siga vigente.

## Seguridad
- RLS habilitado en todas las tablas. Políticas en migraciones.
- `requireAdminAction` / `requireEditorAction` en server actions.
- Proxy (`src/proxy.ts`) con rate limiting auth (10/min), comentarios (30/min), bot detection.
- `X-Robots-Tag` limitado en artículos. Honeypot en CommentForm.
- `CRON_SECRET` obligatorio en API endpoints.
- Bucket Storage renombrado `ads` → `media` para evadir AdBlocker.

## Tokens de diseño (referencia rápida)
- `--color-cream: #f5efe4` (fondo)
- `--color-paper: #fdfbf7` (cards)
- `--color-ink: #0a0a0a` (texto + bordes)
- `--color-brand: #f97316` (naranja)
- `--color-urgente: #c2410c` (burnt sienna)
- Sections: `--color-politica: #e63946`, `deportes: #3b82f6`, `economia: #10b981`, `internacionales: #8b5cf6`, `tucuman: #f59e0b`, `opinion: #0d9488`.
- Hard shadows: `.shadow-hard`, `.shadow-hard-sm`, `.shadow-hard-lg`.
- Halftone: `.halftone`, `.halftone-sm`, `.halftone-light`.

## Pendientes grandes (ver memoria para detalle)
- **Hostinger migration**: botón en `/admin/stats` para disparar scraper + consola en vivo. Hoy no se puede en Netlify.
- **Agenda cultural Tucumán**: feature futuro, schema sin definir.
- **Página individual de columnista** `/opinion/columnista/[slug]`: el roster del `OpinionArchiveLayout` ya está armado para agregar el link.