import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import SubmissionsDashboard from "@/components/admin/SubmissionsDashboard";
import { getAllSubmissions } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user, profile } = await requireEditor();
  const params = await searchParams;
  const status = (params.status as "pending" | "approved" | "rejected" | undefined) || "pending";

  const submissions = await getAllSubmissions(
    status === "pending" || status === "approved" || status === "rejected" ? status : undefined,
  );

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <SubmissionsDashboard submissions={submissions} currentStatus={status} />
    </AdminSiteLayout>
  );
}