'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { sendMagicLink, signInWithPassword } from '@/lib/actions/auth';

interface LoginFormProps {
  initialNext?: string;
  initialError?: string;
}

export function LoginForm({ initialNext, initialError }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
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
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-[var(--text-primary)]">
          Tautan masuk telah dikirim ke <strong>{magicLinkSent}</strong>.
        </p>
        <p className="text-[var(--text-secondary)]">
          Buka inbox (cek folder spam jika perlu) dan klik tautan untuk masuk. Tautan kadaluarsa
          dalam 1 jam.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMagicLinkSent(null)}
          className="self-start"
        >
          Coba dengan email lain
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Email"
        htmlFor="email"
        required
        error={errors.email?.[0]}
      >
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
          placeholder="admin@example.com"
          aria-invalid={Boolean(errors.email)}
        />
      </Field>

      {mode === 'password' ? (
        <Field
          label="Password"
          htmlFor="password"
          required
          error={errors.password?.[0]}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            aria-invalid={Boolean(errors.password)}
          />
        </Field>
      ) : null}

      <Button type="submit" disabled={pending} size="lg">
        {pending
          ? 'Memproses...'
          : mode === 'password'
            ? 'Masuk'
            : 'Kirim tautan masuk'}
      </Button>

      <div className="my-2 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-[var(--text-muted)]">atau</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={() => setMode((m) => (m === 'password' ? 'magic-link' : 'password'))}
        disabled={pending}
      >
        {mode === 'password' ? 'Masuk dengan tautan email' : 'Masuk dengan password'}
      </Button>

      <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
        Lupa password? Pilih opsi tautan email untuk mengatur ulang setelah masuk.
      </p>
    </form>
  );
}
