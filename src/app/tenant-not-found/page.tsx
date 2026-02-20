export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text" dir="rtl">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-3xl font-bold mb-4">הפארק לא נמצא</h1>
        <p className="text-lg mb-6 opacity-70">
          הכתובת שהזנת אינה מוכרת. ייתכן שהקישור שגוי או שהפארק הוסר.
        </p>
        <a
          href="https://realife.vercel.app"
          className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          חזרה לדף הראשי
        </a>
      </div>
    </div>
  );
}
