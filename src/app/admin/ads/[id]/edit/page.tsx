import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAdById } from "@/lib/ads";
import AdForm from "@/components/admin/AdForm";

interface EditAdPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAdPage({ params }: EditAdPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const ad = await getAdById(id);
  if (!ad) redirect("/admin");

  return (
    <div className="min-h-screen bg-[#f0efed]">
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">
              La<span className="text-[#c8102e]">Voz</span>Diaria
            </h1>
            <p className="text-xs text-white/60">Panel de Administración</p>
          </Link>
          <Link href="/admin" className="text-xs text-white/70 hover:text-white transition-colors">
            &larr; Volver al panel
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold mb-6">Editar Aviso</h2>
        <div className="bg-white rounded-lg border border-border p-6">
          <AdForm ad={ad} />
        </div>
      </main>
    </div>
  );
}