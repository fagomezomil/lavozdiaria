import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ColumnistasDashboard from "@/components/admin/ColumnistasDashboard";
import { getAllColumnists } from "@/lib/columnists";

export default async function AdminColumnistsPage() {
  const { user } = await requireAdmin();
  const columnists = await getAllColumnists();

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <ColumnistasDashboard columnists={columnists} />
    </AdminSiteLayout>
  );
}