import { getAllSponsored } from "@/lib/sponsored";
import { requireEditor } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { sectionConfig } from "@/lib/types";
import type { SponsoredContent, Section } from "@/lib/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR");
}

function daysRemaining(expiresAt: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function SponsoredListPage() {
  const { user, profile } = await requireEditor();
  const role = profile?.role ?? "editor";

  const sponsored = await getAllSponsored();

  return (
    <AdminLayout role={role} email={user.email!} activeTab="patrocinados">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Contenido Patrocinado</h2>
        <Link
          href="/admin/sponsored/new"
          className="px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 transition-colors"
        >
          + Nuevo Contenido
        </Link>
      </div>

      {sponsored.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No hay contenido patrocinado cargado.</p>
          <p className="text-sm text-muted/60 mt-1">
            Hacé clic en &ldquo;Nuevo Contenido&rdquo; para crear el primero.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Título</th>
                <th className="px-4 py-2.5 text-left font-semibold">Sección</th>
                <th className="px-4 py-2.5 text-left font-semibold">Cliente</th>
                <th className="px-4 py-2.5 text-left font-semibold">Estado</th>
                <th className="px-4 py-2.5 text-left font-semibold">Portada</th>
                <th className="px-4 py-2.5 text-left font-semibold">Sidebar</th>
                <th className="px-4 py-2.5 text-left font-semibold">Vigencia</th>
                <th className="px-4 py-2.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sponsored.map((item: SponsoredContent) => {
                const cfg = sectionConfig[item.section as Section];
                const days = daysRemaining(item.expiresAt);
                const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
                const isActive = item.active && !isExpired;

                return (
                  <tr key={item.id} className="hover:bg-[#f0efed] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-10 h-7 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-7 bg-[#f0efed] rounded flex items-center justify-center text-[8px] text-muted">
                            Sin img
                          </div>
                        )}
                        <span className="font-semibold truncate max-w-[200px]">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: cfg?.color }}>
                        {cfg?.label ?? item.section}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.clientName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isActive ? "bg-[#10b981]/15 text-[#10b981]" : "bg-[#e63946]/15 text-[#e63946]"
                      }`}>
                        {isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.showOnHomepage ? (
                        <span className="text-[#10b981] font-bold">&#10003;</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.showInSidebar ? (
                        <span className="text-[#8b5cf6] font-bold">&#10003;</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatDate(item.startsAt)} → {formatDate(item.expiresAt)}
                      {days !== null && (
                        <span className={`ml-1 ${days <= 3 ? "text-[#e63946] font-bold" : ""}`}>
                          {days === 0 ? "(Vencido)" : `(${days}d)`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/sponsored/${item.id}/edit`}
                        className="text-[#3b82f6] hover:underline font-semibold"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}