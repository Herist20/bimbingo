import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { Sidebar } from '@/components/shared/sidebar';
import { Topbar } from '@/components/shared/topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          email={user.email ?? ''}
          fullName={profile?.full_name}
          avatarUrl={profile?.avatar_url}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
