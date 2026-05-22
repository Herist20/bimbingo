import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Coins,
  FolderKanban,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { ProjectCard, type ProjectCardProps } from '@/components/portal/project-card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/format';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function fetchDashboard(): Promise<{
  projects: ProjectCardProps[];
  totals: { totalPaid: number; totalValue: number; activeProjects: number };
  firstName: string;
}> {
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from('clients')
    .select('full_name, nickname')
    .eq('client_user_id', user!.id)
    .maybeSingle();

  const firstName =
    client?.nickname ??
    client?.full_name?.split(' ')[0] ??
    user!.email?.split('@')[0] ??
    'Sahabat';

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status')
    .order('created_at', { ascending: false });

  if (!projects || projects.length === 0) {
    return {
      projects: [],
      totals: { totalPaid: 0, totalValue: 0, activeProjects: 0 },
      firstName,
    };
  }

  const projectIds = projects.map((p) => p.id);

  const [{ data: progress }, { data: finance }, { data: nextMilestones }] = await Promise.all([
    supabase
      .from('project_progress_summary')
      .select('project_id, progress_percent')
      .in('project_id', projectIds),
    supabase
      .from('project_finance_summary')
      .select('project_id, total_paid, total_value')
      .in('project_id', projectIds),
    supabase
      .from('project_milestones')
      .select('project_id, title, due_date, status, sequence')
      .in('project_id', projectIds)
      .not('status', 'in', '(approved,done)')
      .order('sequence', { ascending: true }),
  ]);

  const progressBy = new Map<string, number>();
  for (const r of progress ?? []) {
    if (r.project_id) progressBy.set(r.project_id, Number(r.progress_percent ?? 0));
  }
  const financeBy = new Map<string, { paid: number; value: number }>();
  let totalPaid = 0;
  let totalValue = 0;
  for (const r of finance ?? []) {
    if (r.project_id) {
      const paid = Number(r.total_paid ?? 0);
      const value = Number(r.total_value ?? 0);
      financeBy.set(r.project_id, { paid, value });
      totalPaid += paid;
      totalValue += value;
    }
  }
  const nextBy = new Map<string, { title: string; due_date: string | null }>();
  for (const m of nextMilestones ?? []) {
    if (!nextBy.has(m.project_id)) {
      nextBy.set(m.project_id, { title: m.title, due_date: m.due_date });
    }
  }

  const cards: ProjectCardProps[] = projects.map((p) => {
    const fin = financeBy.get(p.id);
    const next = nextBy.get(p.id);
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      progressPercent: progressBy.get(p.id) ?? 0,
      nextMilestoneTitle: next?.title ?? null,
      nextMilestoneDue: next?.due_date ?? null,
      totalPaid: fin?.paid ?? 0,
      totalValue: fin?.value ?? 0,
    };
  });

  const activeProjects = projects.filter((p) =>
    ['draft', 'active', 'on-hold'].includes(p.status),
  ).length;

  return {
    projects: cards,
    totals: { totalPaid, totalValue, activeProjects },
    firstName,
  };
}

export default async function PortalDashboardPage() {
  const { projects, totals, firstName } = await fetchDashboard();
  const outstanding = Math.max(0, totals.totalValue - totals.totalPaid);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Beranda · Portal klien"
        title={`Halo, ${firstName}.`}
        description="Selamat datang di portal pendampingan skripsi Anda. Pantau kemajuan tiap tahap, lihat status pembayaran, dan baca pengingat tahap berikutnya — semua di satu tempat."
        meta={
          <span className="chip chip-brand">
            <Sparkles className="h-3 w-3" />
            Update real-time dari pembimbing
          </span>
        }
      />

      <section aria-label="Ringkasan" className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<FolderKanban className="h-4 w-4" />}
          label="Proyek aktif"
          value={totals.activeProjects.toString()}
          hint={`${projects.length} total tercatat`}
        />
        <StatCard
          icon={<Coins className="h-4 w-4" />}
          label="Sudah dibayar"
          value={formatRupiah(totals.totalPaid)}
          hint={`dari ${formatRupiah(totals.totalValue)}`}
          tone={totals.totalPaid > 0 ? 'success' : undefined}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Sisa tagihan"
          value={formatRupiah(outstanding)}
          hint={outstanding > 0 ? 'menunggu pembayaran' : 'tidak ada tunggakan'}
          tone={outstanding > 0 ? 'warning' : 'success'}
        />
      </section>

      <section aria-label="Daftar proyek" className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--text-display)]">
              Proyek Anda
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Klik kartu untuk melihat detail tahap dan milestone bab.
            </p>
          </div>
          {projects.length > 0 ? (
            <span className="chip">
              <CalendarDays className="h-3 w-3" />
              {projects.length} proyek
            </span>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="Belum ada proyek aktif"
            description="Pembimbing akan menambahkan proyek skripsi Anda di sini setelah onboarding selesai. Hubungi pembimbing lewat WhatsApp jika Anda merasa ini keliru."
            steps={[
              {
                label: 'Konfirmasi data klien',
                description: 'Pastikan email + nama Anda sudah benar di pembimbing.',
              },
              {
                label: 'Tunggu proyek dibuat',
                description: 'Anda akan dapat notifikasi saat proyek pertama tersedia.',
              },
              {
                label: 'Pantau progres di sini',
                description: 'Login kapan saja untuk melihat tahap, file, dan pembayaran.',
              },
            ]}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} {...p} />
            ))}
          </div>
        )}
      </section>

      <HelpSection />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'success' | 'warning';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--success)]'
      : tone === 'warning'
        ? 'text-[var(--warning)]'
        : 'text-[var(--text-display)]';
  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-[var(--bg-subtle)] p-4"
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle, var(--brand-soft) 0%, transparent 70%)',
        }}
      />
      <div className="relative flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md border bg-[var(--bg-elevated)] text-[var(--brand-ink)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {icon}
        </span>
        {label}
      </div>
      <p className={`relative mt-2 font-display text-2xl font-semibold leading-tight ${toneClass}`}>
        {value}
      </p>
      {hint ? (
        <p className="relative mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

function HelpSection() {
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(50% 80% at 100% 0%, var(--accent-soft) 0%, transparent 60%)',
        }}
      />
      <CardHeader className="relative">
        <CardTitle className="font-display text-base">
          Butuh bantuan atau ada pertanyaan?
        </CardTitle>
      </CardHeader>
      <CardContent className="relative grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-sm text-[var(--text-secondary)]">
            Hubungi pembimbing Anda langsung via WhatsApp. Mereka akan membalas pada jam kerja (Senin–Jumat, 09.00–17.00 WIB).
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Tip: tulis pertanyaan singkat & sertakan judul proyek supaya lebih cepat ditanggapi.
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          <HelpRow
            label="Status tahap berubah?"
            desc="Lihat detail proyek → tahap akan diperbarui pembimbing setelah review."
          />
          <HelpRow
            label="Pembayaran termin"
            desc="Buka menu Pembayaran untuk riwayat & sisa tagihan."
          />
          <HelpRow
            label="Ubah data pribadi"
            desc="Saat ini hanya pembimbing yang bisa ubah. Minta lewat WA."
          />
        </ul>
      </CardContent>
      <div
        className="relative border-t px-6 py-3 text-xs"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <Link
          href="/portal/profile"
          className="inline-flex items-center gap-1 font-medium text-[var(--brand)] hover:underline"
        >
          Lihat data akun Anda
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}

function HelpRow({ label, desc }: { label: string; desc: string }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]"
      />
      <div>
        <p className="font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{desc}</p>
      </div>
    </li>
  );
}
