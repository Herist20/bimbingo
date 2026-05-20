import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">404</p>
        <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Halaman yang Anda cari mungkin sudah dipindahkan atau dihapus.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard">Ke Dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Ke Beranda</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
