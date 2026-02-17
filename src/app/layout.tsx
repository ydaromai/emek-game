import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "פארק המעיינות - מסע חיות הבר",
  description: "משחק ציד אוצרות דיגיטלי בפארק המעיינות - סרקו QR, גלו חיות, אספו אותיות ופתרו את החידה!",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2F5D50",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} font-sans antialiased bg-sand text-deep-green min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
