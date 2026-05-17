import { requireAdmin } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import { ToggleRoleForm } from "@/components/admin/ToggleRoleForm";

export default async function AdminUsersPage() {
  const { supabase, user: currentUser } = await requireAdmin();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <AdminLayout role="admin" email={currentUser.email!} activeTab="usuarios">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Usuarios Registrados</h2>
        <span className="text-sm text-muted">{profiles?.length ?? 0} usuarios</span>
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No hay usuarios registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Nombre</th>
                <th className="px-4 py-2.5 text-left font-semibold">Email</th>
                <th className="px-4 py-2.5 text-left font-semibold">Rol</th>
                <th className="px-4 py-2.5 text-left font-semibold">Registro</th>
                <th className="px-4 py-2.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((p: {
                id: string;
                email: string;
                full_name: string;
                role: string;
                created_at: string;
              }) => (
                <tr key={p.id} className="hover:bg-[#f8f5f0] transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {p.full_name || <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        p.role === "admin"
                          ? "bg-[#3b82f6]/15 text-[#3b82f6]"
                          : p.role === "editor"
                            ? "bg-[#f59e0b]/15 text-[#d97706]"
                            : p.role === "suspended"
                              ? "bg-[#e63946]/15 text-[#e63946]"
                              : "bg-[#6b6b6b]/15 text-[#6b6b6b]"
                      }`}
                    >
                      {p.role === "admin" ? "Admin" : p.role === "editor" ? "Editor" : p.role === "suspended" ? "Suspendido" : "Usuario"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {new Date(p.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.id !== currentUser.id && (
                      <ToggleRoleForm userId={p.id} currentRole={p.role} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}