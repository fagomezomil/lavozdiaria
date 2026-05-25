import { getAllAds } from "@/lib/ads";
import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import AvisosDashboard from "@/components/admin/AvisosDashboard";

export default async function AdminDashboard() {
  const { user } = await requireAdmin();

  const ads = await getAllAds();

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <AvisosDashboard ads={ads} />
    </AdminSiteLayout>
  );
}