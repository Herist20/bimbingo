'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, KeyRound, Loader2, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { updatePassword, updateProfile } from '@/lib/actions/profile';

interface ProfileFormProps {
  userId: string;
  email: string;
  initialName: string;
  initialPhone: string;
  initialTimezone: string;
  initialAvatarUrl: string | null;
}

function initials(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function ProfileForm({
  userId,
  email,
  initialName,
  initialPhone,
  initialTimezone,
  initialAvatarUrl,
}: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Identitas state
  const [name, setName] = React.useState(initialName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [timezone, setTimezone] = React.useState(initialTimezone);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initialAvatarUrl);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [identityErrors, setIdentityErrors] = React.useState<Record<string, string>>({});
  const [identityPending, startIdentityTransition] = React.useTransition();

  // Password state
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordErrors, setPasswordErrors] = React.useState<Record<string, string>>({});
  const [passwordPending, startPasswordTransition] = React.useTransition();

  async function handleAvatarFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Hanya menerima PNG / JPEG / WebP.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Ukuran maksimal 2 MB.');
      return;
    }
    setAvatarUploading(true);
    try {
      const supabase = getBrowserSupabase();
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (error) {
        toast.error(`Gagal upload: ${error.message}`);
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // cache bust
      setAvatarUrl(publicUrl);
      // Persist langsung ke profile via updateProfile
      const persist = await updateProfile({
        full_name: name,
        phone,
        timezone,
        avatar_url: publicUrl,
      });
      if (!persist.ok) {
        toast.error('Avatar terupload tapi gagal disimpan ke profil.');
        return;
      }
      toast.success('Avatar diperbarui.');
      router.refresh();
    } finally {
      setAvatarUploading(false);
    }
  }

  function removeAvatar() {
    startIdentityTransition(async () => {
      const result = await updateProfile({
        full_name: name,
        phone,
        timezone,
        avatar_url: null,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setAvatarUrl(null);
      toast.success('Avatar dihapus.');
      router.refresh();
    });
  }

  function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    setIdentityErrors({});
    startIdentityTransition(async () => {
      const result = await updateProfile({
        full_name: name,
        phone,
        timezone,
        avatar_url: avatarUrl,
      });
      if (!result.ok) {
        if (result.error.fields) {
          const errs: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.error.fields)) {
            if (v?.[0]) errs[k] = v[0];
          }
          setIdentityErrors(errs);
        }
        toast.error(result.error.message);
        return;
      }
      toast.success('Profil disimpan.');
      router.refresh();
    });
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordErrors({});
    startPasswordTransition(async () => {
      const result = await updatePassword({
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (!result.ok) {
        if (result.error.fields) {
          const errs: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.error.fields)) {
            if (v?.[0]) errs[k] = v[0];
          }
          setPasswordErrors(errs);
        }
        toast.error(result.error.message);
        return;
      }
      toast.success('Password berhasil diganti.');
      setNewPassword('');
      setConfirmPassword('');
    });
  }

  const displayName = name || email || 'Admin';

  return (
    <div className="flex flex-col gap-6">
      {/* Identitas + Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Identitas</CardTitle>
          <CardDescription>Nama, foto, kontak, dan timezone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="font-display text-lg">{initials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={avatarUploading || identityPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Mengunggah…
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5" />
                      {avatarUrl ? 'Ganti avatar' : 'Unggah avatar'}
                    </>
                  )}
                </Button>
                {avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAvatar}
                    disabled={identityPending || avatarUploading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </Button>
                ) : null}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                PNG / JPEG / WebP · maks 2 MB · tersimpan privat bucket Supabase.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFile(file);
                  if (e.target) e.target.value = ''; // reset supaya re-upload file sama bisa
                }}
              />
            </div>
          </div>

          {/* Form identitas */}
          <form onSubmit={handleIdentitySubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap" htmlFor="full_name" required error={identityErrors.full_name}>
                <Input
                  id="full_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama tampilan Anda"
                />
              </Field>
              <Field label="Email" htmlFor="email" hint="Email tidak bisa diubah dari sini.">
                <Input id="email" value={email} disabled className="opacity-70" />
              </Field>
              <Field label="Nomor HP" htmlFor="phone" error={identityErrors.phone}>
                <Input
                  id="phone"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                />
              </Field>
              <Field label="Timezone" htmlFor="timezone" hint="Mis. Asia/Jakarta" error={identityErrors.timezone}>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Jakarta"
                />
              </Field>
            </div>
            <div className="flex justify-end border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <Button type="submit" disabled={identityPending}>
                {identityPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Simpan identitas
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Ganti password */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Ganti password</CardTitle>
          <CardDescription>
            Minimal 8 karakter. Sesi aktif lain tetap berlaku — sign-out manual via menu akun
            jika ingin invalidasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password baru" htmlFor="new_password" required error={passwordErrors.new_password}>
                <Input
                  id="new_password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 karakter"
                />
              </Field>
              <Field
                label="Konfirmasi password"
                htmlFor="confirm_password"
                required
                error={passwordErrors.confirm_password}
              >
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[11px] text-[var(--text-muted)]">
                Lupa password lama? Pakai mode “Tautan email” saat login → reset lewat email.
              </p>
              <Button
                type="submit"
                disabled={passwordPending || !newPassword || !confirmPassword}
              >
                {passwordPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengganti…
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Ganti password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
