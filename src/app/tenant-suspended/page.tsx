import Link from 'next/link';

interface TenantSuspendedPageProps {
  searchParams: Promise<{ name?: string }>;
}

export default async function TenantSuspendedPage({ searchParams }: TenantSuspendedPageProps) {
  const { name } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text" dir="rtl">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-3xl font-bold mb-4">
          {name
            ? `הפארק ${name} אינו זמין כרגע`
            : 'הפארק אינו זמין כרגע'}
        </h1>
        <p className="text-lg mb-6 opacity-70">
          הפארק שאליו ניסית לגשת אינו פעיל כרגע. נסה שוב מאוחר יותר.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          חזרה לדף הראשי
        </Link>
      </div>
    </div>
  );
}
