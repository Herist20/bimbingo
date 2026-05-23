import { NextResponse } from 'next/server';
import 'server-only';
import { getAdminSupabase } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';

const REMIND_DAYS = [1, 3, 7] as const;
const ACTIVE_STATUSES = ['not-started', 'in-progress', 'submitted', 'revisi'];

export const dynamic = 'force-dynamic';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDates = REMIND_DAYS.map((d) => isoDate(addDays(today, d)));

  const { data: milestones, error } = await admin
    .from('project_milestones')
    .select('id, title, due_date, status, project_id, projects!inner(id, title, owner_id, status)')
    .in('due_date', targetDates)
    .in('status', ACTIVE_STATUSES);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const todayStart = today.toISOString();
  const tomorrowStart = addDays(today, 1).toISOString();
  let inserted = 0;
  let skipped = 0;

  for (const m of milestones ?? []) {
    const project = m.projects as unknown as {
      id: string;
      title: string;
      owner_id: string;
      status: string;
    } | null;
    if (!project || project.status === 'archived' || project.status === 'cancelled') {
      skipped++;
      continue;
    }

    const due = new Date(m.due_date as string);
    due.setHours(0, 0, 0, 0);
    const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', project.owner_id)
      .eq('type', 'deadline_reminder')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart)
      .contains('payload', { milestone_id: m.id });

    if ((count ?? 0) > 0) {
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {
      milestone_id: m.id,
      milestone_title: m.title,
      project_id: project.id,
      project_title: project.title,
      days_to_deadline: days,
    };

    const { error: insertErr } = await admin.from('notifications').insert({
      user_id: project.owner_id,
      type: 'deadline_reminder',
      payload: payload as Json,
    });
    if (insertErr) {
      console.error('[cron daily-reminders] insert failed', insertErr);
      skipped++;
    } else {
      inserted++;
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      checked: milestones?.length ?? 0,
      inserted,
      skipped,
      target_dates: targetDates,
    },
  });
}
