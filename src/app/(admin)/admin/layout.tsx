import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTenant } from '@/lib/tenant';
import { requireAdmin } from '@/lib/auth';
import { AdminShell } from './AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');

  if (!slug) {
    redirect('/');
  }

  const tenant = await getTenant(slug);
  if (!tenant) {
    redirect('/');
  }

  // Detect login page via middleware-set pathname header to skip auth check
  // (unauthenticated users must be able to reach the login page)
  const pathname = headersList.get('x-next-pathname') ?? '';
  const isLoginPage = pathname === '/admin/login';

  let userRole: 'admin' | 'staff' | 'super_admin' = 'staff';

  if (!isLoginPage) {
    const { role } = await requireAdmin(tenant.id);
    userRole = role;
  }

  return (
    <AdminShell
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        branding: tenant.branding,
      }}
      userRole={userRole}
    >
      {children}
    </AdminShell>
  );
}
