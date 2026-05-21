import {
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  FolderKanban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Ringkasan harian' },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/clients', label: 'Klien', icon: Users, hint: 'Daftar mahasiswa dampingan' },
      { href: '/projects', label: 'Proyek', icon: FolderKanban, hint: 'Skripsi & milestone' },
      { href: '/lecturers', label: 'Dosen', icon: GraduationCap, hint: 'Pembimbing & penguji' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { href: '/finance', label: 'Keuangan', icon: CreditCard, hint: 'Pembayaran & ringkasan' },
      { href: '/settings', label: 'Pengaturan', icon: Settings },
    ],
  },
];

// Flat list (compat) — dipakai command palette
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
