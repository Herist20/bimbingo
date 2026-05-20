import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getServerSupabase } from '@/lib/supabase/server';

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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
      <Card>
        <CardHeader>
          <CardTitle>{profile?.full_name ?? user.email}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[var(--text-muted)]">Nomor HP</span>
            <span>{profile?.phone ?? '—'}</span>
          </div>
          <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[var(--text-muted)]">Role</span>
            <span>{profile?.role ?? 'admin'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Timezone</span>
            <span>{profile?.timezone ?? 'Asia/Jakarta'}</span>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Form edit profil akan dibangun pada modul M1.2 (lihat
            <code className="mx-1 rounded bg-[var(--bg-muted)] px-1 py-0.5">
              docs/04-feature-specifications.md
            </code>
            ).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
