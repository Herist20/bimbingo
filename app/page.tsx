import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderKanban,
  GraduationCap,
  KanbanSquare,
  Layers,
  LucideShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/landing/reveal';
import { Marquee } from '@/components/landing/marquee';
import { Faq } from '@/components/landing/faq';
import { HeroMock } from '@/components/landing/hero-mock';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const NAV = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Alur kerja', href: '#alur' },
  { label: 'Stack', href: '#stack' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'FAQ', href: '#faq' },
];

const STATS = [
  { value: '5', unit: 'menit', label: 'setup awal sampai login pertama' },
  { value: '12', unit: 'modul', label: 'lengkap dari klien sampai keuangan' },
  { value: '∞', unit: 'kolom', label: 'kustom per entitas, ala Notion' },
  { value: 'Rp 0', unit: '/bln', label: 'biaya operasional di MVP (free tier)' },
  { value: '4.5', unit: 'minggu', label: 'durasi build MVP, ter-dokumentasi' },
];

const PAINS = [
  {
    title: 'Spreadsheet pecah',
    body: 'File berbagi WhatsApp grup, versi terakhir hilang, formula rusak setelah autosave.',
  },
  {
    title: 'Chat panjang',
    body: 'Revisi dosbing tersembunyi di scroll WA. Deadline lewat karena baru dibaca subuh.',
  },
  {
    title: 'Bukti pembayaran tersesat',
    body: 'Tiap klien punya bukti transfer berbeda format. Reconciliation manual jadi pekerjaan akhir bulan.',
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Klien',
    desc: 'Profil mahasiswa lengkap: kampus, jurusan, target sidang, source. Filter aktif/arsip, search instan.',
  },
  {
    icon: FolderKanban,
    title: 'Proyek skripsi',
    desc: 'Per klien punya satu proyek. Auto-generate Bab 1-5 + Sidang. Weight per bab → progres terhitung.',
  },
  {
    icon: KanbanSquare,
    title: 'Kanban + List',
    desc: 'Drag task antar kolom (Backlog → Pengerjaan → Review → Revisi → Selesai). Order fractional, no rewrite.',
  },
  {
    icon: GraduationCap,
    title: 'Dosen pembimbing',
    desc: 'Profiling karakteristik & tag. Mahasiswa baru langsung dapat tips practical dari pengalaman.',
  },
  {
    icon: CreditCard,
    title: 'Termin pembayaran',
    desc: 'Catat DP, termin per bab, pelunasan. Sisa piutang auto-compute dari view Postgres.',
  },
  {
    icon: FileText,
    title: 'Berkas + signed URL',
    desc: 'Upload draf, bukti, lampiran ke Supabase Storage. Akses via signed URL — private by default.',
  },
  {
    icon: Layers,
    title: 'Custom fields',
    desc: 'Tambah kolom sendiri di klien/proyek/task/dosen/pembayaran. Text, angka, pilihan, tanggal, dll.',
  },
  {
    icon: Sparkles,
    title: 'Command palette',
    desc: 'Cmd / Ctrl + K — lompat halaman, tindakan cepat. Tidak perlu angkat tangan dari keyboard.',
  },
];

const WORKFLOW = [
  {
    n: '01',
    label: 'Daftarkan klien',
    body: 'Catat detail mahasiswa: nama, kontak, kampus, target sidang. Custom field opsional (IG, angkatan, alergi format).',
  },
  {
    n: '02',
    label: 'Buat proyek skripsi',
    body: 'Pilih klien, isi judul + nilai kontrak. Sistem auto-generate milestone bab default — langsung punya peta jalan.',
  },
  {
    n: '03',
    label: 'Kerjakan via board',
    body: 'Drag task antar kolom. Comment per task untuk catatan revisi dosbing. Realtime tersinkron antar tab.',
  },
  {
    n: '04',
    label: 'Catat pembayaran',
    body: 'Termin per bab atau bebas. Verifikasi cocok dengan bukti rekening. Sisa piutang ter-update otomatis.',
  },
  {
    n: '05',
    label: 'Sidang & arsipkan',
    body: 'Tandai milestone selesai. Klien diarsipkan, data tetap retrievable untuk laporan tahunan.',
  },
];

const STACK = [
  { name: 'Next.js 16', desc: 'App Router · Server Actions · Cache Components' },
  { name: 'TypeScript strict', desc: 'Type-safe end-to-end, including Supabase generated types' },
  { name: 'Tailwind v4', desc: 'OKLCH tokens · variable fonts · zero-config' },
  { name: 'Supabase', desc: 'Postgres + Auth + Storage + RLS · ap-southeast-1' },
  { name: 'TanStack Table', desc: 'Dense data tables · dynamic columns · sticky headers' },
  { name: 'dnd-kit', desc: 'Drag & drop board · keyboard accessible · screen-reader OK' },
  { name: 'react-hook-form + zod', desc: 'Validation di boundary, satu schema client + server' },
  { name: 'Recharts', desc: 'Chart minimalis · revenue trend · payment method breakdown' },
];

const ROADMAP = [
  {
    phase: 'Fase 1',
    status: 'MVP',
    label: 'Sekarang',
    items: ['Klien, Proyek, Tasks, Files, Keuangan', 'Custom fields lintas entitas', 'Command palette + onboarding hint'],
    tone: 'brand',
  },
  {
    phase: 'Fase 2',
    status: 'Berikut',
    label: 'Q3 2026',
    items: ['Client portal (mahasiswa login)', 'Payment gateway Midtrans QRIS', 'Notifikasi deadline (cron Vercel)'],
    tone: 'warning',
  },
  {
    phase: 'Fase 3',
    status: 'Roadmap',
    label: '2027',
    items: ['Multi-tenant SaaS B2B', 'Integrasi Fonnte WhatsApp', 'PDF invoice generator + audit log UI'],
    tone: 'neutral',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Apakah Bimbingo aplikasi untuk siapa?',
    a: 'Awalnya internal tool untuk pelaku jasa pendampingan skripsi — solo founder yang ingin ganti workflow spreadsheet + WhatsApp + Drive jadi satu sistem terpusat. Fase berikutnya direncanakan jadi produk SaaS B2B.',
  },
  {
    q: 'Apakah ada biaya untuk pakai versi sekarang?',
    a: 'Tidak. Selama MVP, sistem berjalan di tier gratis Supabase + Vercel Hobby. Cukup untuk satu admin dengan ≤ 30 klien aktif. Naik ke Pro hanya jika traffic membenarkan.',
  },
  {
    q: 'Bagaimana keamanan datanya?',
    a: 'Row Level Security (RLS) Postgres aktif di setiap tabel domain. Owner hanya bisa baca/tulis data miliknya. Storage pakai signed URL — tidak ada bucket publik. Compliance mengacu UU PDP Indonesia (lihat docs/10).',
  },
  {
    q: 'Bisa dikustomisasi sesuai workflow saya?',
    a: 'Ya. Custom fields tersedia di 5 entitas (klien, proyek, task, pembayaran, dosen). Tambah kolom text, angka, pilihan tunggal/ganda, tanggal, URL, boolean — langsung muncul di form & tabel.',
  },
  {
    q: 'Apakah ada mobile app?',
    a: 'Belum. Fokus pertama desktop-first karena workflow utama (board drag, tabel dense, form panjang) lebih natural di layar lebar. Versi responsive sudah tersedia untuk akses cepat dari HP.',
  },
  {
    q: 'Stack-nya kompleks tidak buat dirawat?',
    a: 'Sengaja dipilih stack modern tapi mainstream: Next.js + Supabase + Tailwind. Server Actions menjadi default untuk data flow — minim REST handlers. Validation pakai zod yang shared client+server.',
  },
];

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      <DecorBackdrop />
      <TopNav />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-12 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <Reveal stagger immediate className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-[var(--brand)] opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-[var(--brand)]" />
              </span>
              v0.1 · MVP siap pakai
              <span className="text-[var(--text-muted)]">·</span>
              Studio Almanak
            </span>

            <h1 className="font-display text-5xl font-semibold leading-[0.96] tracking-tight text-[var(--text-display)] sm:text-6xl lg:text-7xl">
              Almanak kerja untuk{' '}
              <span className="relative inline-block">
                <span className="relative z-10 italic text-[var(--brand)]">
                  pendampingan skripsi
                </span>
                <svg
                  aria-hidden
                  className="absolute -bottom-1 left-0 z-0 w-full"
                  height="14"
                  viewBox="0 0 220 14"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 8 C 60 2, 160 12, 218 4"
                    stroke="var(--brand)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </svg>
              </span>
              .
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Bimbingo menggantikan kombinasi <strong className="text-[var(--text-primary)]">spreadsheet + WhatsApp + Google Drive</strong> dengan satu workspace warm-tone yang tenang — tracking klien, progres bab, pembayaran termin, dan dokumen. Tetap dense seperti Jira, tapi tanpa rasa korporat dingin.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Masuk ke dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="https://github.com/Herist20/bimbingo" target="_blank" rel="noreferrer">
                  Lihat kode di GitHub
                </a>
              </Button>
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                Free tier Vercel + Supabase
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                RLS aktif di setiap tabel
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                Open source — gratis fork
              </li>
            </ul>
          </Reveal>

          <Reveal immediate delay={0.15}>
            <HeroMock />
          </Reveal>
        </div>
      </section>

      {/* STATS MARQUEE */}
      <section className="relative border-y" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
        <Marquee duration={36} className="py-6">
          {STATS.concat(STATS).map((s, i) => (
            <div key={i} className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-semibold tracking-tight text-[var(--text-display)]">
                {s.value}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {s.unit}
              </span>
              <span className="max-w-[14rem] text-sm text-[var(--text-secondary)]">{s.label}</span>
              <span aria-hidden className="h-6 w-px bg-[var(--border-strong)]" />
            </div>
          ))}
        </Marquee>
      </section>

      {/* PROBLEM */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-3">
          <SectionKicker>Kenapa Bimbingo</SectionKicker>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
            Sebelum Bimbingo, semua orang punya cerita yang sama.
          </h2>
        </Reveal>

        <Reveal stagger className="grid gap-6 md:grid-cols-3">
          {PAINS.map((p) => (
            <div
              key={p.title}
              className="surface-card relative p-6"
            >
              <span className="absolute right-4 top-4 font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
                /pain
              </span>
              <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--text-display)]">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{p.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* FEATURES */}
      <section
        id="fitur"
        className="relative border-y"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <Reveal className="mb-12 flex max-w-2xl flex-col gap-3">
            <SectionKicker>Modul</SectionKicker>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
              Delapan modul. Satu permukaan tenang.
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              Tiap modul dibuat untuk task-task yang biasa pelaku jasa skripsi temui — bukan sekadar adaptasi tool generik.
            </p>
          </Reveal>

          <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="alur" className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-3">
          <SectionKicker>Alur kerja</SectionKicker>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
            Lima langkah dari calon klien sampai sidang.
          </h2>
        </Reveal>

        <Reveal stagger className="relative grid gap-px overflow-hidden rounded-2xl border bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-5"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          {WORKFLOW.map((w) => (
            <article
              key={w.n}
              className="flex flex-col gap-3 bg-[var(--bg-elevated)] p-6 transition-colors hover:bg-[var(--bg-base)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-[var(--brand)]">{w.n}</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-[var(--bg-subtle)]"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  <Zap className="h-3.5 w-3.5 text-[var(--brand)]" />
                </span>
              </div>
              <h3 className="font-display text-base font-semibold leading-tight text-[var(--text-display)]">
                {w.label}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{w.body}</p>
            </article>
          ))}
        </Reveal>
      </section>

      {/* CUSTOM FIELDS SPOTLIGHT */}
      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, var(--brand-soft) 0%, transparent 40%), radial-gradient(circle at 80% 80%, var(--accent-soft) 0%, transparent 35%)',
          }}
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:px-8">
          <Reveal className="flex flex-col gap-5">
            <SectionKicker>Ala Notion · Jira · ClickUp</SectionKicker>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
              Bangun kolom sendiri di entitas mana saja.
            </h2>
            <p className="text-base leading-relaxed text-[var(--text-secondary)]">
              Bimbingo bawakan custom fields seperti tool besar — tapi datanya tetap di Postgres dengan validasi zod dinamis. Tambah field <em className="text-[var(--text-primary)]">Asal Kota</em>, <em className="text-[var(--text-primary)]">Topik Penelitian</em>, atau <em className="text-[var(--text-primary)]">Preferred Hari Konsultasi</em> tanpa migrasi.
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {[
                'Tipe text, long text, number, currency, percent, date, datetime, boolean, select, multiselect, URL, email, phone',
                'Scope global (semua) atau per-proyek',
                'Per kolom: required, show in form, show in list, show in card',
                'Reorder via drag, archive non-destructive',
              ].map((it) => (
                <li key={it} className="flex items-start gap-2 text-[var(--text-secondary)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  {it}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="relative">
            <div
              className="surface-card relative overflow-hidden"
            >
              <div
                className="flex items-center justify-between border-b px-5 py-3"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="font-display text-sm font-semibold text-[var(--text-display)]">
                  Kelola kolom · Klien
                </span>
                <span className="chip chip-brand text-[10px]">4 aktif</span>
              </div>
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: 'Asal Kota', type: 'text', tone: 'neutral' },
                  { label: 'Topik Penelitian', type: 'long_text', tone: 'neutral' },
                  { label: 'Hari Konsultasi', type: 'select', tone: 'brand' },
                  { label: 'IG handle', type: 'url', tone: 'neutral' },
                  { label: 'Sudah ACC Bab 1', type: 'boolean', tone: 'success' },
                ].map((f) => (
                  <li
                    key={f.label}
                    className="flex items-center gap-3 border-t px-5 py-3 first:border-t-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          f.tone === 'brand'
                            ? 'var(--brand)'
                            : f.tone === 'success'
                              ? 'var(--success)'
                              : 'var(--text-muted)',
                      }}
                    />
                    <span className="flex-1 text-sm text-[var(--text-primary)]">{f.label}</span>
                    <code className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                      {f.type}
                    </code>
                  </li>
                ))}
              </ul>
              <div
                className="flex items-center justify-between border-t bg-[var(--bg-subtle)] px-5 py-3 text-xs text-[var(--text-muted)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <span>Disimpan per browser</span>
                <span className="font-mono">JSONB · GIN indexed</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STACK */}
      <section
        id="stack"
        className="relative border-y"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <Reveal className="mb-12 flex max-w-2xl flex-col gap-3">
            <SectionKicker>Stack</SectionKicker>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
              Dibangun di atas alat-alat yang anda kenal.
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              Mainstream — bukan dari sisi technology hype, dari sisi maintainability. Setiap pilihan didokumentasikan alasannya di <code className="font-mono text-xs">docs/03-tech-stack-architecture.md</code>.
            </p>
          </Reveal>

          <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map((s) => (
              <div
                key={s.name}
                className="rounded-xl border bg-[var(--bg-elevated)] p-5 transition-colors hover:border-[var(--brand-soft)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {s.name.split(' ')[0]}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold leading-tight text-[var(--text-display)]">
                  {s.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-3">
          <SectionKicker>Roadmap</SectionKicker>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
            Tiga fase. Berkembang sambil dipakai.
          </h2>
          <p className="text-base text-[var(--text-secondary)]">
            Disengaja dibangun MVP-first. Setiap fitur tambahan dipertimbangkan dari real usage, bukan asumsi.
          </p>
        </Reveal>

        <Reveal stagger className="grid gap-6 md:grid-cols-3">
          {ROADMAP.map((r) => {
            const isCurrent = r.tone === 'brand';
            const isNext = r.tone === 'warning';
            return (
              <article
                key={r.phase}
                className="surface-card relative overflow-hidden p-6"
                style={
                  isCurrent
                    ? { borderColor: 'var(--brand-ink)', boxShadow: 'var(--shadow-glow)' }
                    : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.2em]"
                    style={{
                      color: isCurrent ? 'var(--brand)' : isNext ? 'var(--warning)' : 'var(--text-muted)',
                    }}
                  >
                    {r.phase} · {r.label}
                  </span>
                  <span
                    className="inline-flex h-6 items-center rounded-full border px-2 text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      borderColor: isCurrent
                        ? 'var(--brand)'
                        : isNext
                          ? 'var(--warning)'
                          : 'var(--border-strong)',
                      color: isCurrent
                        ? 'var(--brand)'
                        : isNext
                          ? 'var(--warning)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {r.status}
                  </span>
                </div>
                <ul className="mt-5 flex flex-col gap-3 text-sm">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <span
                        className="mt-1.5 h-1 w-3 shrink-0"
                        style={{
                          backgroundColor: isCurrent
                            ? 'var(--brand)'
                            : isNext
                              ? 'var(--warning)'
                              : 'var(--text-muted)',
                        }}
                      />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </Reveal>
      </section>

      {/* PRINCIPLES */}
      <section
        className="relative border-y"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <Reveal className="mb-10 flex max-w-2xl flex-col gap-3">
            <SectionKicker>Prinsip</SectionKicker>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
              Lima aturan main yang tidak dilanggar.
            </h2>
          </Reveal>

          <Reveal stagger className="grid gap-px overflow-hidden rounded-2xl border bg-[var(--border)] md:grid-cols-5"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {[
              { n: 'YAGNI', d: 'Tulis kode untuk kebutuhan sekarang. Tidak ada abstraksi spekulatif untuk nanti.' },
              { n: 'DRY tidak premature', d: 'Tiga duplikasi mirip → pertimbangkan ekstrak. Dua → tunggu.' },
              { n: 'RLS wajib', d: 'Setiap tabel domain pakai RLS Postgres. Service-role hanya untuk webhook/cron.' },
              { n: 'Server Action first', d: 'REST handler hanya untuk webhook eksternal. Schema zod shared client+server.' },
              { n: 'Validasi di boundary', d: 'Input external divalidasi. Antar function internal: trust the types.' },
            ].map((p, i) => (
              <article
                key={p.n}
                className="flex flex-col gap-2 bg-[var(--bg-elevated)] p-6"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  #{i + 1}
                </span>
                <h3 className="font-display text-base font-semibold leading-tight text-[var(--text-display)]">
                  {p.n}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{p.d}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative mx-auto max-w-3xl px-6 py-24 lg:px-8">
        <Reveal className="mb-10 flex flex-col gap-3 text-center">
          <SectionKicker className="self-center">FAQ</SectionKicker>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-display)] sm:text-4xl">
            Pertanyaan yang sering ditanya.
          </h2>
        </Reveal>

        <Reveal>
          <Faq items={FAQ_ITEMS} />
        </Reveal>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <Reveal className="relative overflow-hidden rounded-3xl border bg-[var(--bg-elevated)] p-10 sm:p-14"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 0%, var(--brand-soft) 0%, transparent 50%), radial-gradient(circle at 100% 100%, var(--accent-soft) 0%, transparent 50%)',
            }}
          />
          <div
            aria-hidden
            className="absolute -right-12 -top-12 h-44 w-44 rounded-full border opacity-30"
            style={{ borderColor: 'var(--brand)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-10 -left-10 h-32 w-32 rotate-45 border opacity-20"
            style={{ borderColor: 'var(--accent)' }}
          />
          <div className="relative flex flex-col items-start gap-6">
            <SectionKicker>Mulai sekarang</SectionKicker>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-[var(--text-display)] sm:text-5xl">
              Tutup spreadsheet itu.<br />
              <span className="italic text-[var(--brand)]">Buka almanak Anda.</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
              Login dengan akun yang sudah dibuat owner. Atau fork di GitHub dan deploy versi sendiri ke Vercel — semua dokumentasi ada di repo.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Login ke workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="https://github.com/Herist20/bimbingo" target="_blank" rel="noreferrer">
                  Lihat repo
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}

function TopNav() {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'color-mix(in oklab, var(--bg-base) 78%, transparent)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)] text-[var(--bg-base)] shadow-[var(--shadow-glow)]"
          >
            <span className="font-display text-xs font-semibold">B</span>
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-[var(--text-display)]">
            Bimbingo
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">
              Mulai
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SectionKicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brand)] ${className ?? ''}`}
    >
      <span aria-hidden className="h-px w-6 bg-[var(--brand)]" />
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <article
      className="group relative overflow-hidden rounded-xl border bg-[var(--bg-elevated)] p-5 transition-all hover:-translate-y-[2px] hover:border-[var(--brand-soft)] hover:shadow-[var(--shadow-pop)]"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        aria-hidden
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle, var(--brand-soft) 0%, transparent 70%)' }}
      />
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border bg-[var(--bg-subtle)] text-[var(--brand)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-display text-base font-semibold leading-tight text-[var(--text-display)]">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
    </article>
  );
}

function DecorBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(80% 50% at 50% 0%, var(--brand-soft) 0%, transparent 60%), radial-gradient(40% 30% at 10% 30%, var(--accent-soft) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </>
  );
}

function Footer() {
  return (
    <footer
      className="relative border-t"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand)] text-[var(--bg-base)]"
            >
              <span className="font-display text-xs font-semibold">B</span>
            </span>
            <span className="font-display text-base font-semibold tracking-tight">Bimbingo</span>
          </Link>
          <p className="max-w-xs text-xs leading-relaxed text-[var(--text-secondary)]">
            Almanak kerja untuk pelaku jasa pendampingan skripsi. MVP internal · open source.
          </p>
        </div>
        <FooterCol
          title="Produk"
          links={[
            { label: 'Fitur', href: '#fitur' },
            { label: 'Alur kerja', href: '#alur' },
            { label: 'Roadmap', href: '#roadmap' },
            { label: 'Stack', href: '#stack' },
          ]}
        />
        <FooterCol
          title="Sumber"
          links={[
            { label: 'GitHub', href: 'https://github.com/Herist20/bimbingo' },
            { label: 'Dokumen PRD', href: 'https://github.com/Herist20/bimbingo/tree/main/docs' },
            { label: 'Lisensi', href: 'https://github.com/Herist20/bimbingo/blob/main/LICENSE' },
            { label: 'Changelog', href: 'https://github.com/Herist20/bimbingo/commits/main' },
          ]}
        />
        <FooterCol
          title="Kontak"
          links={[
            { label: 'Email owner', href: 'mailto:nosuke1@gmail.com' },
            { label: 'Twitter / X', href: '#' },
            { label: 'Instagram', href: '#' },
            { label: 'WhatsApp', href: '#' },
          ]}
        />
      </div>
      <div
        className="border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-5 text-[11px] text-[var(--text-muted)] sm:flex-row sm:items-center lg:px-8">
          <span className="inline-flex items-center gap-2">
            <Boxes className="h-3.5 w-3.5" />
            © {new Date().getFullYear()} Bimbingo · v0.1 · MVP
          </span>
          <span className="inline-flex items-center gap-2">
            <LucideShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
            RLS aktif · Storage signed URL · UU PDP compliant
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {title}
      </span>
      <ul className="flex flex-col gap-1.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
