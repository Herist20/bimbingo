import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { HashAuthCatcher } from '@/components/shared/hash-auth-catcher';
import './globals.css';

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans-grotesk',
  display: 'swap',
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bimbingo.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Bimbingo — Almanak kerja pendampingan skripsi',
    template: '%s · Bimbingo',
  },
  description:
    'Workspace warm-tone untuk pendampingan skripsi: tracking klien, progres bab, pembayaran termin, dan dokumen. Menggantikan spreadsheet + WhatsApp + Google Drive.',
  applicationName: 'Bimbingo',
  authors: [{ name: 'Heri', url: 'https://github.com/Herist20' }],
  keywords: [
    'bimbingo',
    'pendampingan skripsi',
    'joki skripsi',
    'manajemen klien',
    'kanban skripsi',
    'workflow skripsi',
    'next.js',
    'supabase',
  ],
  category: 'productivity',
  alternates: {
    canonical: SITE_URL,
    languages: { 'id-ID': SITE_URL },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    title: 'Bimbingo — Almanak kerja pendampingan skripsi',
    description:
      'Workspace warm-tone untuk pelaku jasa pendampingan skripsi. Klien, board task, milestone bab, dan termin pembayaran dalam satu permukaan tenang.',
    siteName: 'Bimbingo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bimbingo — Almanak kerja pendampingan skripsi',
    description:
      'Tutup spreadsheet itu. Buka almanak Anda. Workspace terpusat untuk pendampingan skripsi.',
    creator: '@Herist20',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f4ee' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1816' },
  ],
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${bricolageGrotesque.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Anti-flash: set data-theme sebelum React hydrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('bimbingo:theme');
                  var pref = stored && stored !== 'system' ? stored
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.dataset.theme = pref;
                  document.documentElement.style.colorScheme = pref;
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <HashAuthCatcher />
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
