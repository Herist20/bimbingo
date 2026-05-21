import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ProfileForm } from '@/components/profile/profile-form';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
        description="Identitas Anda di workspace. Avatar tampil di komentar task dan menu akun. Ganti password kapan saja."
        meta={
          <>
            <span className="chip chip-brand">{user.email}</span>
            <span className="chip">{profile?.role ?? 'admin'}</span>
          </>
        }
      />

      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        initialName={profile?.full_name ?? ''}
        initialPhone={profile?.phone ?? ''}
        initialTimezone={profile?.timezone ?? 'Asia/Jakarta'}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}
