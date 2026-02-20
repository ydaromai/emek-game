import { requireSuperAdmin } from '@/lib/auth';

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin();

  return (
    <div>
      <h1 className="text-3xl font-bold text-deep-green">Super Admin Dashboard</h1>
    </div>
  );
}
