import { requireAdmin } from "@/lib/supabase/server";
import { getClients } from "@/lib/clients";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";

export default async function AdminClientsPage() {
  const { user } = await requireAdmin();
  const clients = await getClients();

  return (
    <AdminLayout role="admin" email={user.email!} activeTab="clientes">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Clientes</h2>
        <Link
          href="/admin/clients/new"
          className="px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 transition-colors"
        >
          + Nuevo Cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No hay clientes cargados.</p>
          <p className="text-sm text-muted/60 mt-1">
            Hacé clic en &ldquo;Nuevo Cliente&rdquo; para crear el primero.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Nombre</th>
                <th className="px-4 py-2.5 text-left font-semibold">Email</th>
                <th className="px-4 py-2.5 text-left font-semibold">Teléfono</th>
                <th className="px-4 py-2.5 text-center font-semibold">Avisos Activos</th>
                <th className="px-4 py-2.5 text-center font-semibold">Total Avisos</th>
                <th className="px-4 py-2.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-[#f8f5f0] transition-colors">
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-muted">{client.email || "—"}</td>
                  <td className="px-4 py-3 text-muted">{client.phone || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      client.active_ad_count > 0
                        ? "bg-[#10b981]/15 text-[#10b981]"
                        : "bg-[#6b6b6b]/15 text-[#6b6b6b]"
                    }`}>
                      {client.active_ad_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted">{client.ad_count}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-[#3b82f6] hover:underline text-xs font-semibold"
                    >
                      Ver detalle
                    </Link>
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