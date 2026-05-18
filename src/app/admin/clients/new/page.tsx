import { requireAdmin } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import ClientForm from "@/components/admin/ClientForm";

export default async function NewClientPage() {
  const { user } = await requireAdmin();

  return (
    <AdminLayout role="admin" email={user.email!} activeTab="clientes">
      <h2 className="text-lg font-bold mb-6">Nuevo Cliente</h2>
      <div className="bg-white rounded-lg border border-border p-6">
        <ClientForm />
      </div>
    </AdminLayout>
  );
}