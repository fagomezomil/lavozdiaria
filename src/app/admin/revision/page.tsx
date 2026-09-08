import { requireEditor } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import RevisionDashboard from "@/components/admin/RevisionDashboard";
import type { RevisionArticle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RevisionPage() {
  const { user, profile } = await requireEditor();
  const supabase = await createClient();

  // Notas pendientes de revisión (enhanced por el agente LLM, esperando aprobación humana).
  // También las que ya fueron aprobadas/rechazadas para historial (por si Fede quiere ver).
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, original_title, body, original_body, volanta, excerpt, " +
        "section, image_url, image_alt, original_url, enhanced_at, " +
        "enhancer_version, manual_review_required, active"
    )
    .filter("source", "in", '("contextotucuman","ambito","tycsports")')
    .not("enhanced_at", "is", null)
    .order("enhanced_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <AdminSiteLayout role={profile.role} email={user.email!}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-sm text-[var(--color-urgente)]">
            Error cargando notas: {error.message}
          </p>
        </div>
      </AdminSiteLayout>
    );
  }

  // data puede ser null si error; castear a Record<string, unknown>[] para tipado local.
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const articles: RevisionArticle[] = rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    originalTitle: (row.original_title as string) ?? null,
    body: (row.body as string) ?? null,
    originalBody: (row.original_body as string) ?? null,
    volanta: (row.volanta as string) ?? null,
    excerpt: (row.excerpt as string) ?? null,
    section: row.section as RevisionArticle["section"],
    imageUrl: (row.image_url as string) ?? null,
    imageAlt: (row.image_alt as string) ?? "",
    originalUrl: (row.original_url as string) ?? null,
    enhancedAt: (row.enhanced_at as string) ?? null,
    enhancerVersion: (row.enhancer_version as string) ?? null,
    manualReviewRequired: (row.manual_review_required as boolean) ?? false,
  }));

  // Fede necesita ver también el estado "approved" (active=true, manual_review_required=false)
  // vs "rejected" (manually_edited=true + enhanced_at=null). Como filtramos enhanced_at NOT NULL,
  // los rechazados no aparecen. Para simplicidad del primer iter, mostramos solo los que
  // están enhanced (pendientes o ya aprobados). Si Fede quiere historial de rechazados,
  // agregamos un estado después.

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <RevisionDashboard articles={articles} />
      </div>
    </AdminSiteLayout>
  );
}