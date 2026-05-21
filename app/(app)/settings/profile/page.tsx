import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/shared/page-header';
import { OnboardingHint } from '@/components/shared/onboarding-hint';
import { getServerSupabase } from '@/lib/supabase/server';

function initials(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

export default async function ProfilePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, phone, role, timezone')
    .eq('id', user.id)
    .maybeSingle();

  const display = profile?.full_name ?? user.email ?? 'Admin';

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/settings"
        className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Pengaturan
      </Link>

      <PageHeader
        kicker="Pengaturan · Profil"
        title="Profil admin"
        description="Identitas Anda di workspace. Tampilan ini juga muncul di komentar task dan log audit nanti."
      />

      <OnboardingHint
        storageKey="profile-edit-pending"
        title="Form edit belum tersedia"
        description="Edit langsung via Supabase dashboard atau tunggu modul M1.2 (lihat docs/04-feature-specifications.md). Roadmap fase 2."
        tone="info"
      />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={display} />
              ) : null}
              <AvatarFallback className="font-display text-base">
                {initials(display)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <CardTitle className="font-display text-xl">{display}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Nomor HP" value={profile?.phone} mono />
          <Row label="Role" value={profile?.role ?? 'admin'} />
          <Row label="Timezone" value={profile?.timezone ?? 'Asia/Jakarta'} />
          <Row label="User ID" value={user.id} mono small />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Keamanan</CardTitle>
          <CardDescription>Sesi & autentikasi.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Row label="Provider" value="Supabase Auth" />
          <Row
            label="Last sign in"
            value={
              user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString('id-ID')
                : '—'
            }
          />
          <Row
            label="Email confirmed"
            value={user.email_confirmed_at ? 'Ya' : 'Belum'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </span>
      <span
        className={`${mono ? 'font-mono' : ''} ${small ? 'text-xs' : 'text-sm'} text-[var(--text-primary)]`}
      >
        {value ?? <span className="text-[var(--text-muted)]">—</span>}
      </span>
    </div>
  );
}
