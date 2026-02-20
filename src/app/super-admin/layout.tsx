'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/super-admin/dashboard', label: 'לוח בקרה', icon: '📊' },
  { href: '/super-admin/tenants', label: 'דיירים', icon: '🏢' },
  { href: '/super-admin/members', label: 'חברים', icon: '👥' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('full_name').eq('user_id', user.id).single()
          .then(({ data }) => { if (data) setUserName(data.full_name); });
      }
    });
  }, []);

  // Don't show admin shell on login page
  if (pathname === '/super-admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/super-admin/login');
  };

  return (
    <div className="min-h-screen bg-nature-light">
      {/* Top bar */}
      <header className="bg-nature-dark text-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ☰
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">ניהול על</h1>
          <span className="bg-turquoise text-white text-xs font-bold px-2 py-1 rounded">
            Super Admin
          </span>
        </div>
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
  );
}
