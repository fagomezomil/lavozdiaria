import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ColumnistForm from "@/components/admin/ColumnistForm";
import Link from "next/link";

export default async function NewColumnistPage() {
  const { user } = await requireAdmin();

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <div className="mb-6">
        <Link href="/admin/columnists" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Columnistas
        </Link>
      </div>

      <h2 className="text-lg font-bold mb-6">Nuevo Columnista</h2>
      <ColumnistForm />
    </AdminSiteLayout>
  );
}