import { getAllAds } from "@/lib/ads";
import { requireAdmin } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import AdRow from "@/components/admin/AdRow";
import Link from "next/link";

export default async function AdminDashboard() {
  const { user } = await requireAdmin();

  const ads = await getAllAds();

  return (
    <AdminLayout role="admin" email={user.email!} activeTab="avisos">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Avisos Publicitarios</h2>
        <Link
          href="/admin/ads/new"
          className="px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 transition-colors"
        >
          + Nuevo Aviso
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No hay avisos publicitarios cargados.</p>
          <p className="text-sm text-muted/60 mt-1">
            Hacé clic en &ldquo;Nuevo Aviso&rdquo; para crear el primero.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Título</th>
                <th className="px-4 py-2.5 text-left font-semibold">Tipo</th>
                <th className="px-4 py-2.5 text-left font-semibold">Cliente</th>
                <th className="px-4 py-2.5 text-left font-semibold">Sección</th>
                <th className="px-4 py-2.5 text-left font-semibold">Estado</th>
                <th className="px-4 py-2.5 text-left font-semibold">Prioridad</th>
                <th className="px-4 py-2.5 text-left font-semibold">Vigencia</th>
                <th className="px-4 py-2.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ads.map((ad) => (
                <AdRow key={ad.id} ad={ad} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}