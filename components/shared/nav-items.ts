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
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Klien', icon: Users },
  { href: '/projects', label: 'Proyek', icon: FolderKanban },
  { href: '/lecturers', label: 'Dosen', icon: GraduationCap },
  { href: '/finance', label: 'Finance', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];
