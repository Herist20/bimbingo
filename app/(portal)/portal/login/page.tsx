'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Masuk ke Portal Klien</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Bimbingo — Pantau progres skripsi Anda.
          </p>
        </div>

        {stage === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nama@email.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Mengirim…' : 'Kirim Kode'}
            </Button>
          </form>
        )}

        {stage === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
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
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Periksa kotak masuk email <strong>{email}</strong>.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={busy || token.length !== 6}>
              {busy ? 'Memverifikasi…' : 'Masuk'}
            </Button>
            <button
              type="button"
              className="block w-full text-center text-xs text-[var(--text-muted)] hover:underline"
              onClick={() => {
                setStage('email');
                setToken('');
              }}
            >
              Ganti email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
