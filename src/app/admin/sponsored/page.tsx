import { getAllSponsored } from "@/lib/sponsored";
import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import PatrocinadosDashboard from "@/components/admin/PatrocinadosDashboard";

export default async function SponsoredListPage() {
  const { user, profile } = await requireEditor();
  const role = profile?.role ?? "editor";

  const sponsored = await getAllSponsored();

  return (
    <AdminSiteLayout role={role} email={user.email!}>
      <PatrocinadosDashboard sponsored={sponsored} />
    </AdminSiteLayout>
  );
}