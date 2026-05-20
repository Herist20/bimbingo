import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <p
        className="text-xs uppercase tracking-widest"
        style={{ color: 'var(--text-muted)' }}
      >
        scaffold v0.1
      </p>

      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Joki Portal</h1>

      <p className="max-w-lg text-base" style={{ color: 'var(--text-secondary)' }}>
        Ruang kerja terpusat untuk pelaku jasa pendampingan skripsi — tracking klien,
        progres bab, pembayaran, dan dokumen dalam satu tempat.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium text-white shadow-sm transition-colors"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          Masuk ke Dashboard
        </Link>
        <a
          href="https://github.com/"
          className="inline-flex h-11 items-center justify-center rounded-md border px-5 text-sm font-medium transition-colors"
          style={{
            borderColor: 'var(--border-strong)',
            color: 'var(--text-primary)',
          }}
        >
          Lihat Dokumentasi
        </a>
      </div>

      <p className="mt-8 text-xs" style={{ color: 'var(--text-muted)' }}>
        Setup belum lengkap — jalankan migrasi Supabase dan isi <code>.env.local</code>{' '}
        sebelum login.
      </p>
    </main>
  );
}
