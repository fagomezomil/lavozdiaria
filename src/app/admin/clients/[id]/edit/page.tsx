import { requireAdmin } from "@/lib/supabase/server";
import { getClientById } from "@/lib/clients";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ClientForm from "@/components/admin/ClientForm";
import Link from "next/link";
import { redirect } from "next/navigation";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { user } = await requireAdmin();
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) redirect("/admin/clients");

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <div className="mb-6">
        <Link href="/admin/clients" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Clientes
        </Link>
      </div>
      <h2 className="text-lg font-bold mb-6">Editar Cliente</h2>
      <div className="bg-white rounded-lg border border-border p-6">
        <ClientForm client={client} />
      </div>
    </AdminSiteLayout>
  );
}