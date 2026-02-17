import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'visitor');

  // Completed users
  const { count: completedUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'visitor')
    .eq('completion_status', 'completed');

  // Checkpoint distribution
  const { data: checkpointData } = await supabase
    .from('user_progress')
    .select('animal_id, animals(name_he, order_index)')
    .order('animal_id');

  const checkpointCounts: Record<string, { name: string; count: number; order: number }> = {};
  for (const row of checkpointData || []) {
    const animal = row.animals as unknown as { name_he: string; order_index: number } | null;
    const key = row.animal_id;
    if (!checkpointCounts[key]) {
      checkpointCounts[key] = { name: animal?.name_he || '', count: 0, order: animal?.order_index || 0 };
    }
    checkpointCounts[key].count++;
  }

  const distribution = Object.values(checkpointCounts).sort((a, b) => a.order - b.order);

  const total = totalUsers || 0;
  const completed = completedUsers || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    totalUsers: total,
    completedUsers: completed,
    completionRate,
    distribution,
  });
}
