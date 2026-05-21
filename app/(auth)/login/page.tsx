import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  KanbanSquare,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { LoginForm } from './_components/login-form';

const HIGHLIGHTS = [
  {
    icon: Users,
    label: 'Klien terorganisir',
    desc: 'Profil mahasiswa, kampus, target sidang — tidak lagi tersebar di spreadsheet.',
  },
  {
    icon: KanbanSquare,
    label: 'Board kanban',
    desc: 'Drag task antar kolom (Backlog → Review → Selesai). Realtime antar tab.',
  },
  {
    icon: Wallet,
    label: 'Termin pembayaran',
    desc: 'DP, termin per bab, pelunasan. Sisa piutang otomatis terhitung.',
  },
];

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* SHOWCASE ─ kiri */}
      <Showcase />

      {/* FORM ─ kanan */}
      <section
        className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-12"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Beranda
          </Link>
          <Link
            href="https://github.com/Herist20/bimbingo"
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] sm:block"
          >
            Lihat repo →
          </Link>
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">
            {/* Mobile mini brand */}
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand)] text-[var(--bg-base)] shadow-[var(--shadow-glow)]"
              >
                <span className="font-display text-sm font-semibold">B</span>
              </span>
              <span className="font-display text-base font-semibold tracking-tight">Bimbingo</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
                ── Studio Almanak · masuk
              </span>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[var(--text-display)] sm:text-4xl">
                Selamat datang kembali.
              </h1>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Login dengan akun admin Anda atau minta tautan masuk ke email. Tidak ada
                pendaftaran terbuka — workspace privat.
              </p>
            </div>

            <div className="mt-8">
              <LoginFormWrapper searchParams={searchParams} />
            </div>

            <div className="mt-8 flex flex-col gap-2 text-[11px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
                Cookie session di-handle Supabase, signed & httpOnly.
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-[var(--success)]" />
                RLS Postgres aktif — Anda hanya akses data milik sendiri.
              </span>
            </div>
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>© {new Date().getFullYear()} Bimbingo · v0.1 · MVP</span>
          <span className="hidden sm:inline">Bahasa Indonesia · WIB</span>
        </footer>
      </section>
    </div>
  );
}

async function LoginFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm initialNext={params.next} initialError={params.error} />;
}

function Showcase() {
  return (
    <aside
      className="relative isolate hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14"
      style={{
        backgroundColor: 'var(--brand)',
        color: 'oklch(0.98 0.012 60)',
      }}
    >
      {/* Decor — grid lines */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Decor — concentric arcs top-right */}
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        className="absolute -right-24 -top-24 -z-10 h-[28rem] w-[28rem] opacity-25"
      >
        {[...Array(8)].map((_, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={40 + i * 22}
            fill="none"
            stroke="currentColor"
            strokeWidth={i % 2 === 0 ? 1 : 0.5}
            strokeDasharray={i % 3 === 0 ? '4 6' : undefined}
          />
        ))}
      </svg>

      {/* Decor — diagonal stamp bottom-left */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="absolute -bottom-10 -left-10 -z-10 h-72 w-72 opacity-20"
      >
        <g transform="rotate(-12 100 100)">
          <rect
            x="20"
            y="20"
            width="160"
            height="160"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />
          <rect
            x="34"
            y="34"
            width="132"
            height="132"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="100"
            y="105"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="4"
          >
            ALMANAK · 2026
          </text>
        </g>
      </svg>

      {/* Top — brand */}
      <Link href="/" className="relative z-10 flex items-center gap-3 self-start">
        <span
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.98_0.012_60)] text-[var(--brand)]"
        >
          <span className="font-display text-base font-bold">B</span>
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-lg font-semibold tracking-tight">Bimbingo</span>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">
            Studio Almanak
          </span>
        </div>
      </Link>

      {/* Middle — hero + highlights */}
      <div className="relative z-10 flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[oklch(0.98_0.012_60/30%)] bg-[oklch(0.98_0.012_60/8%)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            Workspace privat
          </span>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
            Tutup spreadsheet itu.
            <br />
            <span className="italic">Buka almanak Anda.</span>
          </h2>
          <p className="text-sm leading-relaxed opacity-85">
            Ruang kerja terpusat untuk pendampingan skripsi — tracking klien, progres bab,
            pembayaran termin, dokumen — semua dalam satu tempat.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {HIGHLIGHTS.map((h, i) => {
            const Icon = h.icon;
            return (
              <li
                key={h.label}
                className="flex items-start gap-3 rounded-lg border border-[oklch(0.98_0.012_60/15%)] bg-[oklch(0.98_0.012_60/6%)] p-3 backdrop-blur"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[oklch(0.98_0.012_60/15%)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-baseline gap-1.5 font-display text-sm font-semibold">
                    <span className="font-mono text-[10px] opacity-60">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {h.label}
                  </span>
                  <span className="text-xs leading-relaxed opacity-80">{h.desc}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom — quote + meta */}
      <div className="relative z-10 flex flex-col gap-4">
        <figure className="relative max-w-md rounded-xl border border-[oklch(0.98_0.012_60/15%)] bg-[oklch(0.98_0.012_60/6%)] p-5 backdrop-blur">
          <span
            aria-hidden
            className="absolute -left-1 -top-3 font-display text-5xl leading-none opacity-40"
          >
            “
          </span>
          <blockquote className="font-display text-base leading-relaxed">
            Saya pindah dari Excel + WhatsApp ke Bimbingo dan langsung tahu siapa nunggak,
            siapa deadline Senin, dan siapa butuh diingatkan ke dosbing.
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-2 text-[11px] opacity-75">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.98_0.012_60/20%)] font-display text-[10px] font-bold">
              H
            </span>
            <span>Heri · Founder · sejak 2024</span>
          </figcaption>
        </figure>

        <div className="flex items-center justify-between border-t border-[oklch(0.98_0.012_60/15%)] pt-3 text-[10px] uppercase tracking-[0.18em] opacity-60">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            v0.1 · MVP
          </span>
          <span>Singapore · ap-southeast-1</span>
        </div>
      </div>
    </aside>
  );
}
