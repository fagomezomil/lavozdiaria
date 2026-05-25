import { getAllArticles } from "@/lib/articles";
import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import NotasDashboard from "@/components/admin/NotasDashboard";

export default async function AdminArticlesPage() {
  const { user, profile } = await requireEditor();

  const articles = await getAllArticles();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <NotasDashboard articles={articles} />
    </AdminSiteLayout>
  );
}