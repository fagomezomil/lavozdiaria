import { requireEditor } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSponsoredById } from "@/lib/sponsored";
import { getClients } from "@/lib/clients";
import AdminLayout from "@/components/admin/AdminLayout";
import SponsoredForm from "@/components/admin/SponsoredForm";
import Link from "next/link";

interface EditSponsoredPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSponsoredPage({ params }: EditSponsoredPageProps) {
  const { user, profile } = await requireEditor();
  const role = profile?.role ?? "editor";

  const { id } = await params;
  const content = await getSponsoredById(id);
  if (!content) redirect("/admin/sponsored");

  const clients = await getClients();

  return (
    <AdminLayout role={role} email={user.email!} activeTab="patrocinados">
      <div className="mb-6">
        <Link href="/admin/sponsored" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Contenido Patrocinado
        </Link>
      </div>
      <h2 className="text-lg font-bold mb-6">Editar Contenido Patrocinado</h2>
      <div className="bg-white rounded-lg border border-border p-6">
        <SponsoredForm content={content} clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </AdminLayout>
  );
}