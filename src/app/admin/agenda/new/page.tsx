import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import AgendaEventForm from "@/components/admin/AgendaEventForm";

export default async function NewAgendaEventPage() {
  const { user, profile } = await requireEditor();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="mb-6">
        <h1 className="text-2xl font-[family-name:var(--font-heading)] text-ink">
          Nuevo evento manual
        </h1>
        <p className="text-sm text-muted mt-1">
          Para cargar un evento que no aparece en las fuentes scrapeadas.
        </p>
      </div>
      <AgendaEventForm />
    </AdminSiteLayout>
  );
}