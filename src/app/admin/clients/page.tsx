import { requireAdmin } from "@/lib/supabase/server";
import { getClients } from "@/lib/clients";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ClientesDashboard from "@/components/admin/ClientesDashboard";

export default async function AdminClientsPage() {
  const { user } = await requireAdmin();
  const clients = await getClients();

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <ClientesDashboard clients={clients} />
    </AdminSiteLayout>
  );
}