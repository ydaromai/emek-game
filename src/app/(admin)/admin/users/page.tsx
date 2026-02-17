'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  completion_status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('profiles').select('*').eq('role', 'visitor').order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('completion_status', statusFilter);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query.limit(50);
    setUsers(data || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleExport = () => {
    window.open(`/api/admin/export/users?status=${statusFilter}&search=${search}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-deep-green">משתמשים</h1>
        <Button variant="outline" onClick={handleExport}>ייצוא CSV</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input label="חיפוש" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="שם או אימייל" />
          </div>
          <div>
            <label className="block text-sm font-medium text-deep-green mb-1">סטטוס</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-deep-green/20 bg-white text-deep-green"
            >
              <option value="all">הכל</option>
              <option value="in_progress">בתהליך</option>
              <option value="completed">הושלם</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-deep-green/50 py-8">טוען...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-deep-green/10 text-deep-green/70">
                  <th className="text-right py-2 px-2">שם</th>
                  <th className="text-right py-2 px-2">אימייל</th>
                  <th className="text-right py-2 px-2">טלפון</th>
                  <th className="text-right py-2 px-2">סטטוס</th>
                  <th className="text-right py-2 px-2">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-deep-green/5 hover:bg-sand/30">
                    <td className="py-2 px-2">
                      <Link href={`/admin/users/${u.id}`} className="text-turquoise underline">{u.full_name}</Link>
                    </td>
                    <td className="py-2 px-2" dir="ltr">{u.email}</td>
                    <td className="py-2 px-2" dir="ltr">{u.phone}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.completion_status === 'completed' ? 'bg-success/10 text-success' : 'bg-turquoise/10 text-turquoise'}`}>
                        {u.completion_status === 'completed' ? 'הושלם' : 'בתהליך'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-deep-green/50">{new Date(u.created_at).toLocaleDateString('he-IL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-center text-deep-green/50 py-4">לא נמצאו משתמשים</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
