import { redirect } from 'next/navigation';

import { PortalHeader } from '@/components/portal/portal-header';
import { getServerSupabase } from '@/lib/supabase/server';

export default async function PortalPrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'client') redirect('/dashboard');

  const { data: client } = await supabase
    .from('clients')
    .select('full_name')
    .eq('client_user_id', user.id)
    .maybeSingle();

  const displayName = client?.full_name ?? profile?.full_name ?? user.email ?? 'Klien';

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <PortalHeader fullName={displayName} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
