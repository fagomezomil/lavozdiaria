import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ClientForm from "@/components/admin/ClientForm";

export default async function NewClientPage() {
  const { user } = await requireAdmin();

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <h2 className="text-lg font-bold mb-6">Nuevo Cliente</h2>
      <div className="bg-white rounded-lg border border-border p-6">
        <ClientForm />
      </div>
    </AdminSiteLayout>
  );
}