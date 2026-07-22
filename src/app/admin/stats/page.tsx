import { requireAdmin } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import StatsDashboard from "@/components/admin/StatsDashboard";
import {
  getArticleTimestamps,
  getArticlesBySection,
  getArticlesBySource,
  getStatsTotals,
} from "@/lib/stats";

export default async function AdminStatsPage() {
  const { user } = await requireAdmin();

  const [totals, bySection, bySource, timestamps] = await Promise.all([
    getStatsTotals(),
    getArticlesBySection(),
    getArticlesBySource(),
    getArticleTimestamps(),
  ]);

  return (
    <AdminSiteLayout role="admin" email={user.email!}>
      <StatsDashboard
        totals={totals}
        bySection={bySection}
        bySource={bySource}
        timestamps={timestamps}
      />
    </AdminSiteLayout>
  );
}