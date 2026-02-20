import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { resolveTenant } from "@/lib/tenant";
import { TenantProvider } from "@/components/TenantProvider";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();

  return {
    title: tenant ? `${tenant.name} - מסע חיות הבר` : "פארק המעיינות - מסע חיות הבר",
    description: tenant ? `משחק ציד אוצרות דיגיטלי ב${tenant.name}` : "משחק ציד אוצרות דיגיטלי בפארק המעיינות - סרקו QR, גלו חיות, אספו אותיות ופתרו את החידה!",
  };
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await resolveTenant();

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: tenant?.branding?.primary ?? "#1a8a6e",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await resolveTenant();

  return (
    <html lang="he" dir="rtl">
      <head>
        {tenant && (
          <style dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-primary: ${tenant.branding.primary};
                --color-accent: ${tenant.branding.accent};
                --color-sand: ${tenant.branding.background};
                --color-deep-green: ${tenant.branding.text};
                --color-error: ${tenant.branding.error};
                --color-success: ${tenant.branding.success};
              }
            `
          }} />
        )}
      </head>
      <body className={`${rubik.variable} font-sans antialiased bg-sand text-deep-green min-h-screen`}>
        {tenant ? (
          <TenantProvider tenant={{
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            branding: tenant.branding,
            isActive: tenant.is_active,
          }}>
            {children}
          </TenantProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
