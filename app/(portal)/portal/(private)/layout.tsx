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
      className="relative flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-shell)' }}
    >
      {/* Ambient warm gradient — match landing/admin tone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[340px] opacity-90"
        style={{
          backgroundImage:
            'radial-gradient(60% 80% at 20% 0%, var(--brand-soft) 0%, transparent 55%), radial-gradient(50% 80% at 95% 10%, var(--accent-soft) 0%, transparent 60%)',
        }}
      />
      <PortalHeader fullName={displayName} />
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 sm:px-6">
        {children}
      </main>
      <footer
        className="relative z-10 border-t py-6 text-center text-xs text-[var(--text-muted)]"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <p>
          © Bimbingo · Pendampingan skripsi dengan ketenangan.{' '}
          <span className="text-[var(--text-secondary)]">Butuh bantuan? Hubungi pembimbing Anda lewat WhatsApp.</span>
        </p>
      </footer>
    </div>
  );
}
