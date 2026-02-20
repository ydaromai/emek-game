import type { MetadataRoute } from 'next';
import { resolveTenant } from '@/lib/tenant';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await resolveTenant();

  return {
    name: tenant ? `${tenant.name} - מסע חיות הבר` : 'פארק המעיינות - מסע חיות הבר',
    short_name: tenant?.name ?? 'מסע חיות הבר',
    description: tenant ? `משחק ציד אוצרות דיגיטלי ב${tenant.name}` : 'משחק ציד אוצרות דיגיטלי בפארק המעיינות',
    start_url: '/',
    display: 'standalone',
    background_color: tenant?.branding?.background ?? '#E8D8B9',
    theme_color: tenant?.branding?.primary ?? '#2F5D50',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
