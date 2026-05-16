import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";
import { ToggleRoleForm } from "@/components/admin/ToggleRoleForm";

export default async function AdminUsersPage() {
  const { supabase, user: currentUser } = await requireAdmin();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#f0efed]">
      {/* Header */}
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">
              La<span className="text-[#c8102e]">Voz</span>Diaria
            </h1>
            <p className="text-xs text-white/60">Panel de Administración</p>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-white/70 hover:text-white transition-colors">
              ← Avisos
            </Link>
            <span className="text-xs text-white/60">{currentUser.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Nav tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <Link href="/admin" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Avisos</Link>
          <Link href="/admin/articles" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Notas</Link>
          <span className="pb-2 border-b-2 border-ink font-bold text-sm">Usuarios</span>
        </div>

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
                            : "bg-[#6b6b6b]/15 text-[#6b6b6b]"
                        }`}
                      >
                        {p.role === "admin" ? "Admin" : "Usuario"}
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
      </main>
    </div>
  );
}