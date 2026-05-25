import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import SponsoredForm from "@/components/admin/SponsoredForm";
import { getClients } from "@/lib/clients";
import Link from "next/link";

interface NewSponsoredPageProps {
  searchParams: Promise<{ client_id?: string }>;
}

export default async function NewSponsoredPage({ searchParams }: NewSponsoredPageProps) {
  const { user, profile } = await requireEditor();
  const { client_id } = await searchParams;
  const clients = await getClients();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="mb-6">
        <Link href="/admin/sponsored" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Contenido Patrocinado
        </Link>
      </div>
      <h2 className="text-lg font-bold mb-6">Nuevo Contenido Patrocinado</h2>
      <div className="bg-white rounded-lg border border-border p-6">
        <SponsoredForm initialClientId={client_id} clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </AdminSiteLayout>
  );
}