import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  Bell,
  Boxes,
  Code2,
  Database,
  FileLock2,
  Globe2,
  KeyRound,
  Languages,
  Layers,
  Lock,
  LucideHelpCircle,
  Mail,
  Palette,
  Receipt,
  ShieldCheck,
  Sparkles,
  Type,
  UserCircle,
  Webhook,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { OnboardingHint } from '@/components/shared/onboarding-hint';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RowItem {
  icon: typeof UserCircle;
  label: string;
  desc: string;
  href?: string;
  value?: string;
  tone?: 'success' | 'warning' | 'muted' | 'brand';
  badge?: string;
  status?: 'aktif' | 'fase-2' | 'auto' | 'topbar';
}

const SECTIONS: Array<{
  title: string;
  caption: string;
  items: RowItem[];
}> = [
  {
    title: 'Profil & Akun',
    caption: 'Identitas Anda dan akses workspace.',
    items: [
      {
        icon: UserCircle,
        label: 'Profil admin',
        desc: 'Nama tampilan, avatar, kontak, role, timezone.',
        href: '/settings/profile',
        status: 'aktif',
      },
      {
        icon: KeyRound,
        label: 'Password & sesi',
        desc: 'Reset password via tautan email. Sesi aktif dikelola Supabase Auth.',
        value: 'Supabase Auth',
        tone: 'muted',
        status: 'auto',
      },
      {
        icon: Bell,
        label: 'Notifikasi',
        desc: 'Reminder deadline + email digest harian. Belum aktif di MVP.',
        status: 'fase-2',
      },
    ],
  },
  {
    title: 'Tampilan',
    caption: 'Cara workspace ditampilkan di layar Anda.',
    items: [
      {
        icon: Palette,
        label: 'Tema warna',
        desc: 'Studio Almanak warm — toggle terang/gelap dari ikon di topbar.',
        value: 'Sistem',
        tone: 'brand',
        status: 'topbar',
      },
      {
        icon: Type,
        label: 'Tipografi',
        desc: 'Display: Bricolage Grotesque. Body: Hanken Grotesk. Mono: JetBrains Mono.',
        value: 'Studio Almanak',
        tone: 'muted',
        status: 'auto',
      },
      {
        icon: Languages,
        label: 'Bahasa',
        desc: 'Bahasa Indonesia (id-ID). Locale date pakai date-fns id.',
        value: 'id-ID',
        tone: 'muted',
        status: 'auto',
      },
    ],
  },
  {
    title: 'Data & Custom',
    caption: 'Konfigurasi data, custom fields, dan retensi.',
    items: [
      {
        icon: Layers,
        label: 'Custom fields',
        desc: 'Kelola via tombol “Kelola kolom” di setiap tabel (Klien, Proyek, Dosen, Pembayaran).',
        value: 'Per-page',
        tone: 'brand',
        status: 'aktif',
      },
      {
        icon: Database,
        label: 'Penyimpanan',
        desc: 'Postgres + Storage bucket privat. RLS aktif di setiap tabel domain.',
        value: 'Supabase · ap-southeast-1',
        tone: 'muted',
        status: 'auto',
      },
      {
        icon: Receipt,
        label: 'Ekspor data',
        desc: 'CSV / JSON dump. Dukungan ekspor finance + klien batch ada di fase 2.',
        status: 'fase-2',
      },
    ],
  },
  {
    title: 'Keamanan & Compliance',
    caption: 'Proteksi data dan jejak audit.',
    items: [
      {
        icon: ShieldCheck,
        label: 'Row Level Security',
        desc: 'Setiap tabel domain pakai RLS owner_id = auth.uid(). Cross-tenant terblokir di DB.',
        value: 'Aktif',
        tone: 'success',
        status: 'auto',
      },
      {
        icon: FileLock2,
        label: 'Storage signed URL',
        desc: 'Bucket privat by default. Akses file via signed URL kadaluarsa 1 jam.',
        value: '1 jam',
        tone: 'success',
        status: 'auto',
      },
      {
        icon: Lock,
        label: 'Audit log',
        desc: 'Riwayat perubahan status proyek + log lain dari trigger DB. Buka untuk filter & lihat diff.',
        href: '/settings/audit-log',
        status: 'aktif',
      },
    ],
  },
  {
    title: 'Integrasi',
    caption: 'Channel keluar dan automasi.',
    items: [
      {
        icon: Mail,
        label: 'Email transaksional',
        desc: 'Verifikasi & magic link via Supabase email default. Resend untuk fase 2.',
        value: 'Supabase default',
        tone: 'muted',
        status: 'auto',
      },
      {
        icon: Webhook,
        label: 'WhatsApp (Fonnte)',
        desc: 'Kirim reminder deadline ke klien lewat WA. Fase 2 backlog F2.6.',
        status: 'fase-2',
      },
      {
        icon: Sparkles,
        label: 'AI assist',
        desc: 'Generate ringkasan progres + draft komentar revisi. Belum direncanakan.',
        status: 'fase-2',
      },
    ],
  },
  {
    title: 'Lanjutan',
    caption: 'Untuk pengembang dan operasional.',
    items: [
      {
        icon: Code2,
        label: 'Developer mode',
        desc: 'Akses raw response server action di console + query stat. Pakai env DEBUG.',
        value: 'process.env.DEBUG',
        tone: 'muted',
        status: 'auto',
      },
      {
        icon: Globe2,
        label: 'API publik',
        desc: 'REST handler hanya untuk webhook. Tidak ada public API umum di fase 1.',
        status: 'fase-2',
      },
      {
        icon: LucideHelpCircle,
        label: 'Bantuan & docs',
        desc: '13 dokumen PRD + arsitektur di folder /docs. Cek docs/00-README.md untuk pintu masuk.',
        href: 'https://github.com/Herist20/bimbingo/tree/main/docs',
        status: 'aktif',
      },
    ],
  },
];

const STATUS_STYLE: Record<NonNullable<RowItem['status']>, { label: string; tone: string }> = {
  aktif: { label: 'Aktif', tone: 'var(--success)' },
  auto: { label: 'Otomatis', tone: 'var(--text-muted)' },
  topbar: { label: 'Topbar', tone: 'var(--brand)' },
  'fase-2': { label: 'Fase 2', tone: 'var(--warning)' },
};

export default async function SettingsPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const display = profile?.full_name ?? user.email ?? 'Admin';

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        kicker="Workspace · konfigurasi"
        title="Pengaturan"
        description="Konfigurasi workspace Anda. Beberapa pengaturan dijalankan otomatis oleh sistem dan tidak perlu disentuh."
        meta={
          <>
            <span className="chip chip-brand">Owner · {display}</span>
            <span className="chip">{user.email}</span>
            <span className="chip">Plan: Hobby (free)</span>
          </>
        }
      />

      <OnboardingHint
        storageKey="settings-intro"
        title="Filosofi konfigurasi Bimbingo"
        description="Sengaja minim toggle: hal yang aman & masuk akal di-default. Anda fokus ke pekerjaan, bukan ke setting screen. Yang muncul di sini = hal yang benar-benar bisa Anda ubah, plus info status sistem."
      />

      {/* STAT STRIP */}
      <section
        className="grid grid-cols-2 overflow-hidden rounded-xl border bg-[var(--bg-elevated)] sm:grid-cols-3 lg:grid-cols-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <StatCell label="Region" value="ap-southeast-1" hint="Singapore · Supabase" />
        <StatCell label="Plan" value="Hobby" hint="Rp 0 / bulan · free tier" tone="brand" />
        <StatCell label="RLS" value="Aktif" hint="Owner-only per row" tone="success" />
        <StatCell label="Storage" value="Private" hint="Signed URL · 1 jam" tone="success" />
        <StatCell label="Versi" value="v0.1" hint="MVP build" />
        <StatCell label="Bahasa" value="id-ID" hint="UTC+7 · WIB" />
      </section>

      {/* SECTIONS */}
      <div className="grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title} className="overflow-hidden">
            <CardHeader className="border-b" style={{ borderColor: 'var(--border)' }}>
              <CardTitle className="font-display text-base">{section.title}</CardTitle>
              <CardDescription>{section.caption}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {section.items.map((item) => (
                  <SettingsRow key={item.label} {...item} />
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SYSTEM INFO */}
      <section
        className="rounded-xl border bg-[var(--bg-subtle)] p-5"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-lg border bg-[var(--bg-elevated)] text-[var(--brand)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <Boxes className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-base font-semibold leading-tight text-[var(--text-display)]">
                Tentang sistem
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                Bimbingo v0.1 · MVP · Studio Almanak edition
              </span>
            </div>
          </div>
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] sm:inline">
            build-time
          </span>
        </div>
        <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <SystemPair label="Framework" value="Next.js 16 · App Router" />
          <SystemPair label="DB" value="Supabase Postgres" />
          <SystemPair label="Auth" value="Supabase Auth · email + magic link" />
          <SystemPair label="Hosting" value="Vercel Hobby" />
          <SystemPair label="Storage" value="Supabase Storage · private bucket" />
          <SystemPair label="UI" value="Tailwind v4 · OKLCH tokens" />
          <SystemPair label="DnD" value="dnd-kit · keyboard accessible" />
          <SystemPair label="Form" value="react-hook-form + zod" />
        </dl>
        <div
          className="mt-5 flex items-center justify-between border-t pt-3 text-[10px] text-[var(--text-muted)]"
          style={{ borderColor: 'var(--border)' }}
        >
          <span>© {new Date().getFullYear()} Bimbingo</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-[var(--success)]" />
            RLS aktif · UU PDP compliant · open source
          </span>
        </div>
      </section>
    </div>
  );
}

function SettingsRow(item: RowItem) {
  const Icon = item.icon;
  const status = item.status ? STATUS_STYLE[item.status] : null;
  const isLink = Boolean(item.href);
  const isExternal = item.href?.startsWith('http');

  const inner = (
    <div className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--bg-subtle)]">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
          {status ? (
            <span
              className="inline-flex h-4 items-center rounded-full border px-1.5 text-[9px] font-medium uppercase tracking-wider"
              style={{ borderColor: status.tone, color: status.tone }}
            >
              {status.label}
            </span>
          ) : null}
        </div>
        <span className="text-xs leading-relaxed text-[var(--text-secondary)]">{item.desc}</span>
        {item.value ? (
          <span
            className="mt-1 inline-flex w-fit items-center font-mono text-[10px]"
            style={{
              color:
                item.tone === 'success'
                  ? 'var(--success)'
                  : item.tone === 'warning'
                    ? 'var(--warning)'
                    : item.tone === 'brand'
                      ? 'var(--brand)'
                      : 'var(--text-muted)',
            }}
          >
            {item.value}
          </span>
        ) : null}
      </div>
      {isLink ? (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      ) : null}
    </div>
  );

  if (!isLink) {
    return <li className="opacity-90">{inner}</li>;
  }
  if (isExternal) {
    return (
      <li className="group">
        <a href={item.href} target="_blank" rel="noreferrer" className="block">
          {inner}
        </a>
      </li>
    );
  }
  return (
    <li className="group">
      <Link href={item.href!} className="block">
        {inner}
      </Link>
    </li>
  );
}

function StatCell({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'brand' | 'success';
}) {
  return (
    <div
      className="flex flex-col gap-0.5 border-r border-b p-4 last:border-r-0 sm:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </span>
      <span
        className="font-display text-lg font-semibold leading-tight"
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
      <span className="text-[10px] text-[var(--text-muted)]">{hint}</span>
    </div>
  );
}

function SystemPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="text-xs text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
