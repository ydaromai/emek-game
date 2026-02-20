'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { TenantProvider } from '@/components/TenantProvider';
import type { TenantBranding } from '@/types/database';

interface AdminShellProps {
  tenant: { id: string; name: string; slug: string; branding: TenantBranding };
  userRole: 'admin' | 'staff' | 'super_admin';
  children: React.ReactNode;
}

const allNavItems = [
  { href: '/admin/dashboard', label: 'לוח בקרה', icon: '📊', roles: ['admin', 'super_admin'] },
  { href: '/admin/users', label: 'משתמשים', icon: '👥', roles: ['admin', 'super_admin'] },
  { href: '/admin/animals', label: 'תחנות', icon: '🦎', roles: ['admin', 'super_admin'] },
  { href: '/admin/verify-prize', label: 'אימות פרס', icon: '🎁', roles: ['admin', 'staff', 'super_admin'] },
  { href: '/admin/content', label: 'תוכן', icon: '📝', roles: ['admin', 'super_admin'] },
  { href: '/admin/branding', label: 'מיתוג', icon: '🎨', roles: ['admin', 'super_admin'] },
  { href: '/admin/staff', label: 'צוות', icon: '🧑‍💼', roles: ['admin', 'super_admin'] },
];

export function AdminShell({ tenant, userRole, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('full_name').eq('user_id', user.id).eq('tenant_id', tenant.id).single()
          .then(({ data }) => { if (data) setUserName(data.full_name); });
      }
    });
  }, [tenant.id]);

  // Don't show admin shell on login page
  if (pathname === '/admin/login') {
    return (
      <TenantProvider tenant={{
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: tenant.branding,
        isActive: true,
      }}>
        {children}
      </TenantProvider>
    );
  }

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <TenantProvider tenant={{
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      branding: tenant.branding,
      isActive: true,
    }}>
      <div className="min-h-screen bg-nature-light">
        {/* Top bar */}
        <header className="bg-nature-dark text-white px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold">ניהול {tenant.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:inline">{userName}</span>
            <button onClick={handleLogout} className="text-sm underline min-h-[44px] px-2">
              יציאה
            </button>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <nav className={`
            ${menuOpen ? 'block' : 'hidden'} md:block
            w-56 bg-white border-l border-deep-green/10 min-h-[calc(100vh-52px)]
            fixed md:static z-10
          `}>
            <ul className="py-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      block px-4 py-3 text-sm font-medium min-h-[44px]
                      flex items-center gap-2
                      ${pathname === item.href
                        ? 'bg-turquoise/10 text-turquoise border-l-3 border-turquoise'
                        : 'text-deep-green hover:bg-sand/50'
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}
