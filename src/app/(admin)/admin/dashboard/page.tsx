'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';

interface Analytics {
  totalUsers: number;
  completedUsers: number;
  completionRate: number;
  distribution: { name: string; count: number; order: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-center py-10 text-deep-green/50">טוען...</p>;

  const maxCount = Math.max(...data.distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-deep-green">לוח בקרה</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-4xl font-bold text-deep-green">{data.totalUsers}</p>
          <p className="text-sm text-deep-green/50 mt-1">משתמשים רשומים</p>
        </Card>
        <Card className="text-center">
          <p className="text-4xl font-bold text-turquoise">{data.completionRate}%</p>
          <p className="text-sm text-deep-green/50 mt-1">אחוז השלמה</p>
        </Card>
        <Card className="text-center">
          <p className="text-4xl font-bold text-success">{data.completedUsers}</p>
          <p className="text-sm text-deep-green/50 mt-1">השלימו את המשחק</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-deep-green mb-4">התפלגות סריקות לפי תחנה</h2>
        <div className="space-y-2">
          {data.distribution.map((d) => (
            <div key={d.order} className="flex items-center gap-3">
              <span className="w-20 text-sm text-deep-green/70 truncate">{d.name}</span>
              <div className="flex-1 h-6 bg-deep-green/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-turquoise rounded-full transition-all"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-deep-green w-8 text-left">{d.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
