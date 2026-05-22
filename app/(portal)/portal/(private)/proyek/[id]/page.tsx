import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarCheck,
  CircleDot,
  Coins,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  MilestoneList,
  type MilestoneRow,
} from '@/components/portal/milestone-list';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draf',
  active: 'Aktif',
  'on-hold': 'Dijeda',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_TONE: Record<
  string,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger'
> = {
  draft: 'neutral',
  active: 'brand',
  'on-hold': 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, type, status, target_end_date, start_date')
    .eq('id', id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: milestones }, { data: progress }, { data: finance }] =
    await Promise.all([
      supabase
        .from('project_milestones')
        .select('id, title, sequence, due_date, status')
        .eq('project_id', id)
        .order('sequence', { ascending: true }),
      supabase
        .from('project_progress_summary')
        .select('progress_percent, completed_milestones, total_milestones')
        .eq('project_id', id)
        .maybeSingle(),
      supabase
        .from('project_finance_summary')
        .select('total_paid, total_value, outstanding')
        .eq('project_id', id)
        .maybeSingle(),
    ]);

  const pct = Math.round(Number(progress?.progress_percent ?? 0));
  const completedMs = Number(progress?.completed_milestones ?? 0);
  const totalMs = Number(progress?.total_milestones ?? 0);
  const totalPaid = Number(finance?.total_paid ?? 0);
  const totalValue = Number(finance?.total_value ?? 0);
  const outstanding = Math.max(0, totalValue - totalPaid);

  const nextMilestone = (milestones ?? []).find(
    (m) => m.status !== 'approved' && m.status !== 'done',
  );

  return (
    <div className="space-y-8">
      <Link
        href="/portal"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke beranda
      </Link>

      <PageHeader
        kicker="Detail proyek"
        title={project.title}
        description="Pantau setiap tahap, target tanggal, dan progres dari pembimbing Anda."
        meta={
          <>
            <Badge tone={STATUS_TONE[project.status] ?? 'neutral'}>
              {STATUS_LABEL[project.status] ?? project.status}
            </Badge>
            {project.type ? (
              <span className="chip capitalize">{project.type}</span>
            ) : null}
            {project.target_end_date ? (
              <span className="chip">
                <CalendarCheck className="h-3 w-3" />
                Target {formatTanggal(project.target_end_date)}
              </span>
            ) : null}
          </>
        }
      />

      <section
        aria-label="Ringkasan progres"
        className="grid gap-3 sm:grid-cols-3"
      >
        <Stat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Progres total"
          value={`${pct}%`}
          hint={`${completedMs} dari ${totalMs} tahap selesai`}
          renderExtra={
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--bg-muted)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background:
                    'linear-gradient(90deg, var(--brand) 0%, var(--brand-hover) 100%)',
                }}
              />
            </div>
          }
        />
        <Stat
          icon={<Coins className="h-4 w-4" />}
          label="Pembayaran"
          value={formatRupiah(totalPaid)}
          hint={`dari ${formatRupiah(totalValue)}`}
          tone={outstanding === 0 ? 'success' : undefined}
        />
        <Stat
          icon={<CircleDot className="h-4 w-4" />}
          label="Tahap aktif"
          value={nextMilestone?.title ?? '—'}
          hint={
            nextMilestone?.due_date
              ? `Target ${formatTanggal(nextMilestone.due_date)}`
              : 'Semua tahap sudah selesai'
          }
        />
      </section>

      {nextMilestone ? (
        <Card className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(60% 90% at 0% 0%, var(--brand-soft) 0%, transparent 60%)',
            }}
          />
          <CardContent className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Yang sedang dikerjakan
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-[var(--text-display)]">
                {nextMilestone.title}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {nextMilestone.due_date
                  ? `Target selesai ${formatTanggal(nextMilestone.due_date)}.`
                  : 'Belum ada target tanggal — diskusikan dengan pembimbing.'}
              </p>
            </div>
            <span className="chip chip-brand">
              <CircleDot className="h-3 w-3" />
              Pantau update
            </span>
          </CardContent>
        </Card>
      ) : null}

      <section aria-label="Daftar tahap" className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--text-display)]">
            Tahapan proyek
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Urut sesuai progres pembimbing. Status diperbarui setelah review tiap bab.
          </p>
        </div>
        <MilestoneList milestones={(milestones ?? []) as MilestoneRow[]} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">
            Tahap-tahap berikut akan diperbarui pembimbing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            Anda <strong>tidak perlu</strong> mengubah status sendiri — pembimbing yang me-mark setiap bab sebagai dikerjakan / diserahkan / disetujui setelah review.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Kalau ada koreksi judul/target tanggal, hubungi pembimbing via WhatsApp.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
  renderExtra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'success';
  renderExtra?: React.ReactNode;
}) {
  const toneClass =
    tone === 'success' ? 'text-[var(--success)]' : 'text-[var(--text-display)]';
  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-[var(--bg-subtle)] p-4"
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md border bg-[var(--bg-elevated)] text-[var(--brand-ink)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {icon}
        </span>
        {label}
      </div>
      <p
        className={`mt-2 font-display text-xl font-semibold leading-tight ${toneClass}`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
      {renderExtra}
    </div>
  );
}
