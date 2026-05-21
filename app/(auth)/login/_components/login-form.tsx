'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Loader2, Mail, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { sendMagicLink, signInWithPassword } from '@/lib/actions/auth';

interface LoginFormProps {
  initialNext?: string;
  initialError?: string;
}

type Mode = 'password' | 'magic-link';

const MODES: Array<{ key: Mode; label: string; icon: typeof KeyRound }> = [
  { key: 'password', label: 'Password', icon: KeyRound },
  { key: 'magic-link', label: 'Tautan email', icon: Mail },
];

export function LoginForm({ initialNext, initialError }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>('password');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, startTransition] = React.useTransition();
  const [magicLinkSent, setMagicLinkSent] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  function clearFieldError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _omit, ...rest } = prev;
      return rest;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    startTransition(async () => {
      if (mode === 'password') {
        const result = await signInWithPassword({ email, password });
        if (!result.ok) {
          if (result.error.fields) setErrors(result.error.fields);
          toast.error(result.error.message);
          return;
        }
        toast.success('Berhasil masuk');
        router.push(initialNext ?? result.data.redirectTo);
        router.refresh();
        return;
      }

      const result = await sendMagicLink({ email });
      if (!result.ok) {
        if (result.error.fields) setErrors(result.error.fields);
        toast.error(result.error.message);
        return;
      }
      setMagicLinkSent(result.data.email);
      toast.success('Tautan masuk telah dikirim. Cek inbox email Anda.');
    });
  }

  if (magicLinkSent) {
    return (
      <div
        className="flex flex-col gap-4 rounded-xl border bg-[var(--bg-subtle)] p-5 text-sm"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]"
          >
            <MailCheck className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-display text-base font-semibold text-[var(--text-display)]">
              Tautan terkirim
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Cek inbox{' '}
              <strong className="break-all text-[var(--text-primary)]">{magicLinkSent}</strong>.
              Klik link untuk masuk. Kadaluarsa dalam 1 jam.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMagicLinkSent(null)}
          className="self-start"
        >
          ← Coba email lain
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div
        role="tablist"
        aria-label="Metode masuk"
        className="inline-flex h-10 items-center gap-0.5 rounded-md border bg-[var(--bg-subtle)] p-1"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        {MODES.map((m) => {
          const Icon = m.icon;
          const selected = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setMode(m.key);
                clearFieldError('password');
              }}
              className={cn(
                'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm px-3 text-sm font-medium transition-all',
                selected
                  ? 'bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      <Field label="Email" htmlFor="email" required error={errors.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          placeholder="admin@bimbingo.id"
          aria-invalid={Boolean(errors.email)}
        />
      </Field>

      {mode === 'password' ? (
        <Field
          label={
            <span className="flex items-center justify-between gap-2">
              <span>Password</span>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="h-3 w-3" /> Sembunyikan
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Tampilkan
                  </>
                )}
              </button>
            </span>
          }
          htmlFor="password"
          required
          error={errors.password?.[0]}
        >
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
          />
        </Field>
      ) : (
        <div
          className="rounded-md border border-dashed bg-[var(--bg-subtle)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          Kami kirim tautan satu-kali-pakai ke email Anda. Aman untuk akun tanpa password.
        </div>
      )}

      <Button type="submit" disabled={pending} size="lg" className="mt-1 w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses…
          </>
        ) : mode === 'password' ? (
          <>
            <KeyRound className="h-4 w-4" />
            Masuk
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Kirim tautan masuk
          </>
        )}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
        Lupa password? Pakai mode <strong className="font-semibold text-[var(--text-secondary)]">Tautan email</strong>{' '}
        untuk masuk, lalu reset dari pengaturan profil.
      </p>
    </form>
  );
}
