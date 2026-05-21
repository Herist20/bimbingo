import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Cetak',
  robots: { index: false, follow: false },
};

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white text-[#1a1310] print:bg-white">
      <style
        // Inline print stylesheet — clean A4 layout, hide screen-only chrome
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A4; margin: 14mm 12mm; }
            @media print {
              :root { color-scheme: light !important; }
              html, body { background: #fff !important; }
              .no-print { display: none !important; }
              .print-shell { box-shadow: none !important; border: none !important; padding: 0 !important; }
              a { color: inherit !important; text-decoration: none !important; }
            }
          `,
        }}
      />
      {children}
    </div>
  );
}
