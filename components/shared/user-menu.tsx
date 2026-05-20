'use client';

import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

function initials(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');
}

export function UserMenu({ email, fullName, avatarUrl }: UserMenuProps) {
  const display = fullName ?? email.split('@')[0] ?? 'Admin';

  async function handleSignOut() {
    try {
      const res = await fetch('/auth/sign-out', { method: 'POST', redirect: 'manual' });
      if (res.type === 'opaqueredirect' || res.ok || res.status === 303) {
        window.location.href = '/login';
        return;
      }
      toast.error('Gagal keluar. Coba lagi.');
    } catch {
      toast.error('Gagal keluar. Cek koneksi.');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu akun">
          <Avatar>
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={display} /> : null}
            <AvatarFallback>{initials(display)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">{display}</span>
            <span className="text-xs text-[var(--text-muted)]">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <User className="h-4 w-4" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            Pengaturan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
