'use server';

import { getServerSupabase } from '@/lib/supabase/server';
import { fail, ok, requireUser, type ActionResult } from './_helper';

export type UrgentType = 'deadline-overdue' | 'deadline-soon' | 'project-stale' | 'payment-overdue';
export type UrgentSeverity = 'urgent' | 'warning' | 'info';

export interface UrgentItem {
  id: string; // stable, dipakai untuk dismiss
  type: UrgentType;
  severity: UrgentSeverity;
  title: string;
  hint: string;
  href: string;
  /** Hari dari hari ini (negatif = overdue, positif = future). */
  daysFromToday: number;
  /** Reference timestamp (deadline atau updated_at). */
  refAt: string;
}

export interface UrgentPayload {
  items: UrgentItem[];
  total: number;
  urgentCount: number;
  warningCount: number;
}

const STALE_DAYS = 5;
const OUTSTANDING_DAYS = 30; // proyek active > 30 hari tanpa lunas

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function diffDays(target: string) {
  const t = new Date(target);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = t.getTime() - today.getTime();
  return Math.round(ms / 86400000);
}

export async function getUrgentItems(): Promise<ActionResult<UrgentPayload>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();

    const today = new Date();
    const inSevenDays = isoDate(new Date(today.getTime() + 7 * 86400000));
    const staleCutoff = new Date(today);
    staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS);
    const outstandingCutoff = new Date(today);
    outstandingCutoff.setDate(outstandingCutoff.getDate() - OUTSTANDING_DAYS);

    const [tasksRes, staleRes, projectsRes, financeRes] = await Promise.all([
      // Task overdue + deadline ≤ 7 hari
      supabase
        .from('tasks')
        .select(`
          id, title, due_date, status, project_id,
          project:projects!inner(id, title, status, archived_at)
        `)
        .neq('status', 'done')
        .not('due_date', 'is', null)
        .lte('due_date', inSevenDays)
        .order('due_date', { ascending: true })
        .limit(20),
      // Proyek stale > 5 hari
      supabase
        .from('projects')
        .select('id, title, updated_at, status, archived_at, total_value, start_date')
        .is('archived_at', null)
        .eq('status', 'active')
        .lt('updated_at', staleCutoff.toISOString())
        .order('updated_at', { ascending: true })
        .limit(10),
      // Proyek aktif yang start_date > 30 hari (untuk hitung outstanding overdue)
      supabase
        .from('projects')
        .select('id, title, status, archived_at, start_date')
        .is('archived_at', null)
        .eq('status', 'active')
        .not('start_date', 'is', null)
        .lt('start_date', isoDate(outstandingCutoff))
        .limit(20),
      // Finance summary untuk hitung outstanding per proyek
      supabase.from('project_finance_summary').select('project_id, outstanding, total_value'),
    ]);

    if (tasksRes.error) throw tasksRes.error;
    if (staleRes.error) throw staleRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (financeRes.error) throw financeRes.error;

    const items: UrgentItem[] = [];

    // 1. Task deadlines
    for (const t of tasksRes.data ?? []) {
      const proj = (t as unknown as {
        project?: { id: string; title: string; status: string; archived_at: string | null };
      }).project;
      if (!proj || proj.archived_at || proj.status !== 'active') continue;
      if (!t.due_date) continue;
      const days = diffDays(t.due_date);
      const overdue = days < 0;
      items.push({
        id: `${overdue ? 'deadline-overdue' : 'deadline-soon'}:${t.id}`,
        type: overdue ? 'deadline-overdue' : 'deadline-soon',
        severity: overdue ? 'urgent' : days <= 2 ? 'warning' : 'info',
        title: t.title,
        hint:
          overdue
            ? `Telat ${Math.abs(days)} hari · ${proj.title}`
            : days === 0
              ? `Deadline hari ini · ${proj.title}`
              : `${days} hari lagi · ${proj.title}`,
        href: `/projects/${proj.id}/board`,
        daysFromToday: days,
        refAt: t.due_date,
      });
    }

    // 2. Stale projects
    for (const p of staleRes.data ?? []) {
      const daysSince = Math.abs(diffDays(p.updated_at.slice(0, 10)));
      items.push({
        id: `project-stale:${p.id}`,
        type: 'project-stale',
        severity: daysSince > 14 ? 'warning' : 'info',
        title: p.title,
        hint: `Tidak ada update ${daysSince} hari`,
        href: `/projects/${p.id}`,
        daysFromToday: -daysSince,
        refAt: p.updated_at,
      });
    }

    // 3. Outstanding overdue
    const financeMap = new Map(
      (financeRes.data ?? []).map((f) => [f.project_id, f.outstanding ?? 0]),
    );
    for (const p of projectsRes.data ?? []) {
      const outstanding = financeMap.get(p.id) ?? 0;
      if (outstanding <= 0 || !p.start_date) continue;
      const daysSinceStart = Math.abs(diffDays(p.start_date));
      items.push({
        id: `payment-overdue:${p.id}`,
        type: 'payment-overdue',
        severity: daysSinceStart > 60 ? 'urgent' : 'warning',
        title: p.title,
        hint: `Piutang ${formatRupiahShort(outstanding)} · proyek berjalan ${daysSinceStart} hari`,
        href: `/projects/${p.id}/finance`,
        daysFromToday: -daysSinceStart,
        refAt: p.start_date,
      });
    }

    // Sort: urgent dulu, lalu warning, lalu info; tie → daysFromToday ascending (paling lama lewat / paling dekat)
    const severityRank: Record<UrgentSeverity, number> = { urgent: 0, warning: 1, info: 2 };
    items.sort((a, b) => {
      if (a.severity !== b.severity) return severityRank[a.severity] - severityRank[b.severity];
      return a.daysFromToday - b.daysFromToday;
    });

    const urgentCount = items.filter((i) => i.severity === 'urgent').length;
    const warningCount = items.filter((i) => i.severity === 'warning').length;

    return ok({
      items,
      total: items.length,
      urgentCount,
      warningCount,
    });
  } catch (e) {
    return fail(e);
  }
}

function formatRupiahShort(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
}
