import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ArticleForm from "@/components/admin/ArticleForm";
import Link from "next/link";
import { getActiveColumnists } from "@/lib/columnists";
import type { Section } from "@/lib/types";

interface NewArticlePageProps {
  searchParams: Promise<{ section?: string; ref?: string }>;
}

const VALID_SECTIONS: Section[] = ["politica", "deportes", "economia", "internacionales", "tucuman", "opinion"];

export default async function NewArticlePage({ searchParams }: NewArticlePageProps) {
  const { user, profile } = await requireEditor();

  const sp = await searchParams;
  const defaultSection = VALID_SECTIONS.includes(sp.section as Section) ? (sp.section as Section) : undefined;
  const ref = sp.ref;
  const backHref = ref === "opinion" ? "/admin/opinion" : "/admin/articles";
  const backLabel = ref === "opinion" ? "Volver a Notas de Opinión" : "Volver a Notas";

  const columnists = await getActiveColumnists();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="mb-6">
        <Link href={backHref} className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; {backLabel}
        </Link>
      </div>

      <h2 className="text-lg font-bold mb-6">
        {defaultSection === "opinion" ? "Nueva Nota de Opinión" : "Nueva Nota"}
      </h2>
      <ArticleForm columnists={columnists} defaultSection={defaultSection} />
    </AdminSiteLayout>
  );
}