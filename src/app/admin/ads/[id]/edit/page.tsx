import { requireAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAdById } from "@/lib/ads";
import AdminLayout from "@/components/admin/AdminLayout";
import AdForm from "@/components/admin/AdForm";
import Link from "next/link";

interface EditAdPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAdPage({ params }: EditAdPageProps) {
  const { user } = await requireAdmin();

  const { id } = await params;
  const ad = await getAdById(id);
  if (!ad) redirect("/admin");

  return (
    <AdminLayout role="admin" email={user.email!} activeTab="avisos">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Avisos
        </Link>
      </div>
      <h2 className="text-lg font-bold mb-6">Editar Aviso</h2>
      <div className="bg-white rounded-lg border border-border p-6">
        <AdForm ad={ad} />
      </div>
    </AdminLayout>
  );
}