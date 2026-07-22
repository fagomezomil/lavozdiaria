import { requireAdmin } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ColumnistForm from "@/components/admin/ColumnistForm";
import { getColumnistById } from "@/lib/columnists";
import Link from "next/link";

interface EditColumnistPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditColumnistPage({ params }: EditColumnistPageProps) {
  const { user } = await requireAdmin();

  const { id } = await params;
  const columnist = await getColumnistById(id);

  if (!columnist) redirect("/admin/columnists");

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <div className="mb-6">
        <Link href="/admin/columnists" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Columnistas
        </Link>
      </div>

      <h2 className="text-lg font-bold mb-6">Editar Columnista</h2>
      <ColumnistForm columnist={columnist} />
    </AdminSiteLayout>
  );
}