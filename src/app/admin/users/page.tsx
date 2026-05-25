import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import UsuariosDashboard from "@/components/admin/UsuariosDashboard";

export default async function AdminUsersPage() {
  const { supabase, user: currentUser } = await requireAdmin();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  const users = (profiles || []) as {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
  }[];

  return (
    <AdminSiteLayout role="admin" email={currentUser.email!}>
      <UsuariosDashboard users={users} currentUserId={currentUser.id} />
    </AdminSiteLayout>
  );
}