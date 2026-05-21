'use server';

import { getServerSupabase } from '@/lib/supabase/server';
import { fail, ok, requireUser, type ActionResult } from './_helper';

export type UpcomingDeadline = {
  task_id: string;
  title: string;
  due_date: string;
  status: string;
  project_id: string;
  project_title: string;
  client_name: string;
  client_whatsapp: string | null;
};

export type StaleProject = {
  project_id: string;
  title: string;
  client_name: string;
  client_whatsapp: string | null;
  updated_at: string;
};

export type DashboardSummary = {
  active_clients: number;
  active_projects: number;
  revenue_this_month: number;
  total_outstanding: number;
  upcoming_deadlines: UpcomingDeadline[];
  stale_projects: StaleProject[];
  revenue_chart: Array<{ month: string; total: number }>;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function monthsAgo(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() - months, 1);
}

export async function getDashboardSummary(): Promise<ActionResult<DashboardSummary>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();

    const today = new Date();
    const startMonth = isoDate(startOfMonth(today));
    const inSevenDays = isoDate(addDays(today, 7));
    const todayISO = isoDate(today);
    const sixMonthsAgo = isoDate(monthsAgo(today, 5)); // 6 bulan termasuk bulan ini
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoISO = fiveDaysAgo.toISOString();

    const [
      clientsCountRes,
      projectsCountRes,
      revenueRes,
      financeSummaryRes,
      upcomingTasksRes,
      staleRes,
      chartPaymentsRes,
    ] = await Promise.all([
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null),
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .eq('status', 'active'),
      supabase
        .from('payments')
        .select('amount')
        .gte('paid_at', startMonth)
        .lte('paid_at', todayISO),
      supabase.from('project_finance_summary').select('outstanding, project_id'),
      supabase
        .from('tasks')
        .select(`
          id, title, due_date, status, project_id,
          project:projects!inner(
            id, title, status, archived_at,
            client:clients!inner(full_name, whatsapp)
          )
        `)
        .neq('status', 'done')
        .gte('due_date', todayISO)
        .lte('due_date', inSevenDays)
        .order('due_date', { ascending: true })
        .limit(8),
      supabase
        .from('projects')
        .select(`id, title, updated_at, status, archived_at, client:clients!inner(full_name, whatsapp)`)
        .is('archived_at', null)
        .eq('status', 'active')
        .lt('updated_at', fiveDaysAgoISO)
        .order('updated_at', { ascending: true })
        .limit(8),
      supabase
        .from('payments')
        .select('amount, paid_at')
        .gte('paid_at', sixMonthsAgo)
        .lte('paid_at', todayISO),
    ]);

    if (clientsCountRes.error) throw clientsCountRes.error;
    if (projectsCountRes.error) throw projectsCountRes.error;
    if (revenueRes.error) throw revenueRes.error;
    if (financeSummaryRes.error) throw financeSummaryRes.error;
    if (upcomingTasksRes.error) throw upcomingTasksRes.error;
    if (staleRes.error) throw staleRes.error;
    if (chartPaymentsRes.error) throw chartPaymentsRes.error;

    // Hanya hitung outstanding untuk proyek aktif. Karena view tidak punya status,
    // ambil daftar id proyek aktif lalu filter.
    const { data: activeProjectIds, error: idsError } = await supabase
      .from('projects')
      .select('id')
      .is('archived_at', null)
      .eq('status', 'active');
    if (idsError) throw idsError;
    const activeSet = new Set((activeProjectIds ?? []).map((p) => p.id));

    const totalOutstanding = (financeSummaryRes.data ?? [])
      .filter((r) => r.project_id && activeSet.has(r.project_id))
      .reduce((s, r) => s + Math.max(0, r.outstanding ?? 0), 0);

    const revenueThisMonth = (revenueRes.data ?? []).reduce(
      (s, p) => s + (p.amount ?? 0),
      0,
    );

    const upcoming: UpcomingDeadline[] = (upcomingTasksRes.data ?? [])
      .map((t) => {
        const proj = (t as unknown as {
          project?: {
            id: string;
            title: string;
            status: string;
            archived_at: string | null;
            client?: { full_name?: string; whatsapp?: string | null };
          };
        }).project;
        if (!proj || proj.archived_at || proj.status !== 'active') return null;
        return {
          task_id: t.id,
          title: t.title,
          due_date: t.due_date!,
          status: t.status,
          project_id: proj.id,
          project_title: proj.title,
          client_name: proj.client?.full_name ?? '—',
          client_whatsapp: proj.client?.whatsapp ?? null,
        } as UpcomingDeadline;
      })
      .filter((v): v is UpcomingDeadline => v !== null)
      .slice(0, 5);

    const stale: StaleProject[] = (staleRes.data ?? []).map((p) => {
      const client = (p as unknown as { client?: { full_name?: string; whatsapp?: string | null } }).client;
      return {
        project_id: p.id,
        title: p.title,
        client_name: client?.full_name ?? '—',
        client_whatsapp: client?.whatsapp ?? null,
        updated_at: p.updated_at,
      };
    }).slice(0, 5);

    // Chart: bucket per bulan terakhir 6 bulan, prefill 0
    const chartMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = monthsAgo(today, i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      chartMap.set(key, 0);
    }
    for (const p of chartPaymentsRes.data ?? []) {
      const key = p.paid_at?.slice(0, 7);
      if (!key || !chartMap.has(key)) continue;
      chartMap.set(key, (chartMap.get(key) ?? 0) + (p.amount ?? 0));
    }
    const revenueChart = Array.from(chartMap.entries()).map(([month, total]) => ({
      month,
      total,
    }));

    return ok({
      active_clients: clientsCountRes.count ?? 0,
      active_projects: projectsCountRes.count ?? 0,
      revenue_this_month: revenueThisMonth,
      total_outstanding: totalOutstanding,
      upcoming_deadlines: upcoming,
      stale_projects: stale,
      revenue_chart: revenueChart,
    });
  } catch (e) {
    return fail(e);
  }
}
