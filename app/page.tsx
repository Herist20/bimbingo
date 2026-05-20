import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="h-6 w-6 rounded-md bg-[var(--brand)]" aria-hidden />
            Bimbingo
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Mulai</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center">
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Pendampingan skripsi · tertata · terlacak
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Ruang kerja terpusat untuk pendampingan skripsi.
        </h1>
        <p className="max-w-xl text-base" style={{ color: 'var(--text-secondary)' }}>
          Tracking klien, progres bab, pembayaran termin, dan dokumen — semua dalam satu tempat.
          Menggantikan kombinasi spreadsheet + WhatsApp + Google Drive.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Masuk ke Dashboard</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href="https://github.com/Herist20/bimbingo" target="_blank" rel="noreferrer">
              Lihat Dokumentasi
            </a>
          </Button>
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          v0.1 · MVP internal · landing page penuh menyusul (lihat <code>docs/07-landing-page-prd.md</code>)
        </p>
      </section>

      <section
        className="border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-12 sm:grid-cols-3">
          {[
            {
              title: 'Klien & dosbing',
              body: 'Profil mahasiswa + karakteristik dosen pembimbing. Tidak perlu lagi catatan tersebar.',
            },
            {
              title: 'Kanban + List view',
              body: 'Lacak progres bab via board atau list dengan custom column ala Notion / ClickUp.',
            },
            {
              title: 'Keuangan termin',
              body: 'Catat DP, termin per bab, pelunasan. Sisa piutang dihitung otomatis.',
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{f.title}</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer
        className="border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>© {new Date().getFullYear()} Bimbingo</span>
          <span>v0.1 · MVP</span>
        </div>
      </footer>
    </main>
  );
}
