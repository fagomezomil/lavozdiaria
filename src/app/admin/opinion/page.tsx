import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import OpinionDashboard from "@/components/admin/OpinionDashboard";
import { getAllArticles } from "@/lib/articles";
import { getAllColumnists } from "@/lib/columnists";

export default async function AdminOpinionPage() {
  const { user, profile } = await requireEditor();

  const [allArticles, columnists] = await Promise.all([
    getAllArticles(),
    getAllColumnists(),
  ]);

  const opinionArticles = allArticles.filter((a) => a.section === "opinion");

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <OpinionDashboard articles={opinionArticles} columnists={columnists} />
    </AdminSiteLayout>
  );
}