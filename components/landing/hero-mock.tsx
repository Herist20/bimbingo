import { CheckCircle2, FolderKanban, GraduationCap, Users } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

/**
 * Visual hero — stylised dashboard window. CSS/HTML only, ringan, anti-flash.
 * Tampak seperti screenshot tapi 100% layout DOM jadi tetap responsive.
 */
export function HeroMock() {
  return (
    <div className="relative w-full">
      {/* Glow halo */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[2rem] opacity-70 blur-3xl"
        style={{
          background:
            'conic-gradient(from 120deg at 50% 50%, var(--brand-soft) 0%, transparent 35%, var(--accent-soft) 60%, transparent 90%)',
        }}
      />

      {/* Frame */}
      <div
        className="relative overflow-hidden rounded-2xl border bg-[var(--bg-elevated)] shadow-[var(--shadow-pop)]"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-2 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
        >
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--warning)]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]/60" />
          </span>
          <span className="mx-auto inline-flex items-center gap-2 rounded-md border bg-[var(--bg-base)] px-3 py-0.5 font-mono text-[10px] text-[var(--text-muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            bimbingo.app/dashboard
          </span>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <aside
            className="hidden w-40 shrink-0 border-r p-3 sm:block"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--brand)] font-display text-[10px] font-bold text-[var(--bg-base)]">
                B
              </span>
              <span className="font-display text-xs font-semibold text-[var(--text-display)]">
                Bimbingo
              </span>
            </div>

            <div className="flex flex-col gap-1 text-[10px]">
              <span className="px-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Workspace
              </span>
              <MiniNav label="Dashboard" active />
              <span className="mt-2 px-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Data
              </span>
              <MiniNav label="Klien" />
              <MiniNav label="Proyek" />
              <MiniNav label="Dosen" />
              <span className="mt-2 px-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Operasional
              </span>
              <MiniNav label="Keuangan" />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Senin · 20 Mei 2026
                </p>
                <h3 className="font-display text-lg font-semibold leading-tight text-[var(--text-display)]">
                  Ruang kerja Bimbingo
                </h3>
              </div>
              <span className="chip chip-brand text-[9px]">8 klien aktif</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Stat icon={Users} label="Klien" value="8" tone="brand" />
              <Stat icon={FolderKanban} label="Proyek" value="12" />
              <Stat icon={CheckCircle2} label="Lunas" value="3" tone="success" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <KanbanCol title="Backlog" count={4} />
              <KanbanCol title="Pengerjaan" count={3} accent />
              <KanbanCol title="Selesai" count={6} success />
            </div>

            <div
              className="mt-3 flex items-center justify-between rounded-md border p-2"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                <GraduationCap className="h-3 w-3 text-[var(--brand)]" />
                Total piutang
              </span>
              <span className="font-display text-xs font-semibold text-[var(--text-display)]">
                {formatRupiah(4_750_000)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div
        className="absolute -left-3 top-1/3 hidden rotate-[-6deg] rounded-xl border bg-[var(--bg-elevated)] px-3 py-2 shadow-[var(--shadow-pop)] sm:block"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Cmd · K
        </p>
        <p className="font-display text-xs font-semibold">Command palette</p>
      </div>

      <div
        className="absolute -right-3 bottom-1/4 hidden rotate-[5deg] rounded-xl border bg-[var(--bg-elevated)] px-3 py-2 shadow-[var(--shadow-pop)] sm:block"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Custom field
        </p>
        <p className="font-display text-xs font-semibold">Bangun kolom sendiri</p>
      </div>
    </div>
  );
}

function MiniNav({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={
        active
          ? 'flex items-center gap-1.5 rounded-sm bg-[var(--brand-soft)] px-1.5 py-1 text-[10px] font-medium text-[var(--brand-ink)]'
          : 'flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-[10px] text-[var(--text-secondary)]'
      }
    >
      <span
        className={
          active
            ? 'h-1.5 w-1.5 rounded-full bg-[var(--brand)]'
            : 'h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]/40'
        }
      />
      {label}
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'brand' | 'success';
}) {
  return (
    <div
      className="flex items-start justify-between rounded-md border bg-[var(--bg-base)] p-2"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {label}
        </span>
        <span
          className="font-display text-base font-semibold leading-tight"
          style={{
            color:
              tone === 'brand'
                ? 'var(--brand)'
                : tone === 'success'
                  ? 'var(--success)'
                  : 'var(--text-display)',
          }}
        >
          {value}
        </span>
      </div>
      <Icon className="h-3 w-3 text-[var(--text-muted)]" />
    </div>
  );
}

function KanbanCol({
  title,
  count,
  accent,
  success,
}: {
  title: string;
  count: number;
  accent?: boolean;
  success?: boolean;
}) {
  const bg = success ? 'var(--success-soft)' : accent ? 'var(--brand-soft)' : 'var(--bg-subtle)';
  const ink = success ? 'var(--success)' : accent ? 'var(--brand-ink)' : 'var(--text-secondary)';
  return (
    <div
      className="rounded-md border p-1.5"
      style={{ borderColor: 'var(--border)', backgroundColor: bg }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium" style={{ color: ink }}>
          {title}
        </span>
        <span className="text-[9px] font-mono" style={{ color: ink }}>
          {count}
        </span>
      </div>
      <div className="mt-1 flex flex-col gap-1">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <span
            key={i}
            className="h-3 w-full rounded-sm bg-[var(--bg-base)]"
            style={{ opacity: 1 - i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
