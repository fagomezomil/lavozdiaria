import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import AdForm from "@/components/admin/AdForm";
import Link from "next/link";

export default async function NewAdPage() {
  const { user } = await requireAdmin();

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Avisos
        </Link>
      </div>
      <h2 className="text-lg font-bold mb-6">Nuevo Aviso</h2>
      <div className="bg-white rounded-lg border border-border p-6">
        <AdForm />
      </div>
    </AdminSiteLayout>
  );
}