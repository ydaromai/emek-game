'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useTenant } from '@/components/TenantProvider';

interface StaffMember {
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  full_name: string;
}

export default function AdminStaffPage() {
  const { slug } = useTenant();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff', {
        headers: { 'x-tenant-slug': slug },
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching effect, setState is async after await
    loadStaff();
  }, [loadStaff]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({ email: inviteEmail, role: 'staff' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || 'שגיאה בהוספת איש צוות');
      } else {
        setInviteSuccess('איש צוות נוסף בהצלחה');
        setInviteEmail('');
        setShowInvite(false);
        loadStaff();
      }
    } catch {
      setInviteError('שגיאה בהוספת איש צוות');
    }

    setInviting(false);
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm('האם להסיר את איש הצוות?')) return;

    setRevokingId(userId);
    try {
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: 'DELETE',
        headers: { 'x-tenant-slug': slug },
      });

      if (res.ok) {
        loadStaff();
      }
    } catch {
      // silently fail
    }
    setRevokingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-deep-green">ניהול צוות</h1>
        <Button
          variant="secondary"
          onClick={() => {
            setShowInvite(!showInvite);
            setInviteError('');
            setInviteSuccess('');
          }}
        >
          {showInvite ? 'ביטול' : 'הוספת איש צוות'}
        </Button>
      </div>

      {inviteSuccess && (
        <div className="bg-success/10 text-success px-4 py-3 rounded-xl text-sm font-medium">
          {inviteSuccess}
        </div>
      )}

      {showInvite && (
        <Card>
          <form onSubmit={handleInvite} className="space-y-3">
            <h2 className="text-lg font-bold text-deep-green">הוספת איש צוות חדש</h2>
            <p className="text-sm text-deep-green/60">
              הזינו את כתובת האימייל של איש הצוות. אם המשתמש לא קיים במערכת, הוא יווצר אוטומטית.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="אימייל"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-green mb-1">תפקיד</label>
                <select
                  disabled
                  className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-deep-green/20 bg-white text-deep-green opacity-70"
                >
                  <option value="staff">צוות</option>
                </select>
              </div>
              <Button type="submit" isLoading={inviting} disabled={!inviteEmail}>
                הוספה
              </Button>
            </div>
            {inviteError && (
              <p className="text-sm text-error font-medium">{inviteError}</p>
            )}
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-center text-deep-green/50 py-8">טוען...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-deep-green/10 text-deep-green/70">
                  <th className="text-right py-2 px-2">שם</th>
                  <th className="text-right py-2 px-2">אימייל</th>
                  <th className="text-right py-2 px-2">תפקיד</th>
                  <th className="text-right py-2 px-2">תאריך שיוך</th>
                  <th className="text-right py-2 px-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.user_id} className="border-b border-deep-green/5 hover:bg-sand/30">
                    <td className="py-2 px-2">{member.full_name || '-'}</td>
                    <td className="py-2 px-2" dir="ltr">{member.email}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.role === 'admin'
                          ? 'bg-turquoise/10 text-turquoise'
                          : 'bg-deep-green/10 text-deep-green'
                      }`}>
                        {member.role === 'admin' ? 'מנהל' : 'צוות'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-deep-green/50">
                      {new Date(member.created_at).toLocaleDateString('he-IL')}
                    </td>
                    <td className="py-2 px-2">
                      {member.role === 'staff' && (
                        <Button
                          variant="outline"
                          className="!min-h-[36px] !px-3 !py-1 !text-sm text-error border-error hover:bg-error/5"
                          onClick={() => handleRevoke(member.user_id)}
                          disabled={revokingId === member.user_id}
                          isLoading={revokingId === member.user_id}
                        >
                          הסרה
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staff.length === 0 && (
              <p className="text-center text-deep-green/50 py-4">אין אנשי צוות</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
