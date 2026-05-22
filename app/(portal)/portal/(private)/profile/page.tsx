import { redirect } from 'next/navigation';
import {
  AtSign,
  GraduationCap,
  Lock,
  Phone,
  ShieldCheck,
  University,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PortalProfilePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: client } = await supabase
    .from('clients')
    .select(
      'full_name, nickname, email, whatsapp, university, faculty, major, student_id, semester',
    )
    .eq('client_user_id', user.id)
    .maybeSingle();

  const initials = (client?.full_name ?? user.email ?? 'K')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Profil · Akun klien"
        title={client?.full_name ?? user.email ?? 'Profil Anda'}
        description="Data akademis Anda yang dipakai pembimbing untuk menyusun proyek skripsi. Hanya pembimbing yang bisa mengubah — silakan hubungi via WhatsApp kalau perlu koreksi."
        meta={
          <>
            <span className="chip chip-brand">
              <ShieldCheck className="h-3 w-3" />
              Login aktif
            </span>
            {client?.nickname ? (
              <span className="chip">Akrab dipanggil “{client.nickname}”</span>
            ) : null}
          </>
        }
      />

      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(40% 70% at 100% 0%, var(--brand-soft) 0%, transparent 60%)',
          }}
        />
        <CardContent className="relative flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border font-display text-2xl font-semibold text-[var(--brand-ink)] shadow-[var(--shadow-card)]"
            style={{
              borderColor: 'var(--border-strong)',
              backgroundColor: 'var(--brand-soft)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="font-display text-lg font-semibold text-[var(--text-display)]">
              {client?.full_name ?? user.email}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {client?.major ?? '—'}
              {client?.faculty ? ` · ${client.faculty}` : ''}
            </p>
            {client?.university ? (
              <p className="text-xs text-[var(--text-muted)]">
                {client.university}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-[var(--brand-ink)]">
                <AtSign className="h-3.5 w-3.5" />
              </span>
              Kontak
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Field
              icon={<AtSign className="h-3.5 w-3.5" />}
              label="Email"
              value={client?.email ?? user.email ?? '—'}
            />
            <Field
              icon={<Phone className="h-3.5 w-3.5" />}
              label="WhatsApp"
              value={client?.whatsapp ?? '—'}
              mono
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-[var(--brand-ink)]">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              Akademis
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Field
              icon={<University className="h-3.5 w-3.5" />}
              label="Kampus"
              value={client?.university ?? '—'}
            />
            <Field
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="Fakultas"
              value={client?.faculty ?? '—'}
            />
            <Field
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="Jurusan"
              value={client?.major ?? '—'}
            />
            <Field
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="NIM"
              value={client?.student_id ?? '—'}
              mono
            />
            <Field
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="Semester"
              value={client?.semester ? String(client.semester) : '—'}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(50% 80% at 100% 100%, var(--accent-soft) 0%, transparent 60%)',
          }}
        />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-[var(--brand-ink)]">
              <Lock className="h-3.5 w-3.5" />
            </span>
            Keamanan & data
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-3 text-sm text-[var(--text-secondary)]">
          <p>
            Akun Anda login dengan email + kode OTP 6-digit. Tidak ada password
            untuk diingat — setiap kali login, kami kirim kode baru ke email
            yang terdaftar.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Untuk keluar, gunakan tombol <strong>Keluar</strong> di pojok kanan
            atas. Sesi akan otomatis berakhir setelah 1 jam tidak aktif.
          </p>
          <div
            className="mt-2 rounded-lg border bg-[var(--bg-subtle)] p-3 text-xs"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="font-medium text-[var(--text-primary)]">
              Mau ubah data di atas?
            </p>
            <p className="mt-0.5 text-[var(--text-muted)]">
              Hubungi pembimbing Anda lewat WhatsApp dengan permintaan + data
              baru. Pembimbing akan update sistem.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {label}
        </p>
        <p
          className={`mt-0.5 truncate ${mono ? 'font-mono text-xs' : 'text-sm'} text-[var(--text-primary)]`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
