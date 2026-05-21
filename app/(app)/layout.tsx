import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import { Sidebar } from '@/components/shared/sidebar';
import { SidebarProvider } from '@/components/shared/sidebar-context';
import { Topbar } from '@/components/shared/topbar';
import { CommandPalette } from '@/components/shared/command-palette';

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
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            email={user.email ?? ''}
            fullName={profile?.full_name}
            avatarUrl={profile?.avatar_url}
          />
          <main
            className="relative z-10 flex-1 overflow-y-auto p-6"
            style={{ backgroundColor: 'var(--bg-base)' }}
          >
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}
