import Link from "next/link";
import { getAllAds } from "@/lib/ads";
import { requireAdmin } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";
import AdRow from "@/components/admin/AdRow";

export default async function AdminDashboard() {
  const { user } = await requireAdmin();

  const ads = await getAllAds();

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
            <span className="text-xs text-white/60">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Nav tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <span className="pb-2 border-b-2 border-ink font-bold text-sm">Avisos</span>
          <Link href="/admin/articles" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Notas</Link>
          <Link href="/admin/users" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Usuarios</Link>
        </div>

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
      </main>
    </div>
  );
}