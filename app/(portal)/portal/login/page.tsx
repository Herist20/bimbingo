'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, GraduationCap, Mail, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPortalOtp, verifyPortalOtp } from '@/lib/actions/portal';

export default function PortalLoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await requestPortalOtp({ email });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success('Kode dikirim ke email Anda.');
    setStage('otp');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await verifyPortalOtp({ email, token });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    router.push('/portal');
    router.refresh();
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{ backgroundColor: 'var(--bg-shell)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(45% 65% at 15% 10%, var(--brand-soft) 0%, transparent 55%), radial-gradient(40% 60% at 90% 90%, var(--accent-soft) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 grid w-full max-w-3xl gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Left: brand panel */}
        <div className="hidden flex-col gap-6 lg:flex">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2"
            aria-label="Bimbingo"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg border bg-[var(--brand-soft)] text-[var(--brand-ink)] shadow-[var(--shadow-card)]"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl font-semibold tracking-tight text-[var(--text-display)]">
                Bimbingo
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Portal Klien
              </span>
            </span>
          </Link>

          <div>
            <span className="inline-flex w-fit items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              Akses pendampingan skripsi
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-[1.05] tracking-tight text-[var(--text-display)]">
              Pantau setiap tahap skripsi Anda di satu tempat.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
              Lihat progres milestone bab, status pembayaran termin, dan
              tahap berikutnya — diperbarui langsung oleh pembimbing Anda.
            </p>
          </div>

          <ul className="space-y-2.5 text-sm">
            <Bullet>Tidak perlu password — login dengan kode 6-digit dari email.</Bullet>
            <Bullet>Data hanya bisa diakses akun Anda (RLS terjamin).</Bullet>
            <Bullet>Mobile-friendly — buka dari HP saat bimbingan.</Bullet>
          </ul>
        </div>

        {/* Right: form panel */}
        <div
          className="surface-card relative overflow-hidden p-6 sm:p-8"
          style={{ boxShadow: 'var(--shadow-pop)' }}
        >
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-[var(--brand-soft)] text-[var(--brand-ink)]"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-base font-semibold tracking-tight">
                  Bimbingo
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Portal Klien
                </span>
              </span>
            </Link>
          </div>

          <div>
            <span className="inline-flex w-fit items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              {stage === 'email' ? 'Masuk via email' : 'Verifikasi kode'}
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--text-display)]">
              {stage === 'email'
                ? 'Masuk ke portal'
                : 'Cek kotak masuk Anda'}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {stage === 'email'
                ? 'Masukkan email yang sudah didaftarkan pembimbing.'
                : `Kami kirim 6 digit kode ke ${email}.`}
            </p>
          </div>

          {stage === 'email' && (
            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Mengirim…' : (
                  <>
                    Kirim kode
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-[var(--text-muted)]">
                Email belum dikenali? Hubungi pembimbing supaya mengaktifkan akses portal.
              </p>
            </form>
          )}

          {stage === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="token">Kode 6 digit</Label>
                <Input
                  id="token"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-[0.5em]"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Tidak terima email? Cek folder spam — atau tunggu beberapa menit.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={busy || token.length !== 6}
              >
                {busy ? 'Memverifikasi…' : 'Masuk'}
              </Button>
              <button
                type="button"
                className="block w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
                onClick={() => {
                  setStage('email');
                  setToken('');
                }}
              >
                ← Ganti email
              </button>
            </form>
          )}

          <div
            className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-[var(--text-muted)]"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>
              Akun klien — admin Bimbingo masuk via{' '}
              <Link
                href="/login"
                className="font-medium text-[var(--brand)] hover:underline"
              >
                halaman admin
              </Link>
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]"
      />
      <span className="text-[var(--text-secondary)]">{children}</span>
    </li>
  );
}
