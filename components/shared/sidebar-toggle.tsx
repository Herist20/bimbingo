'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from './sidebar-context';

export function SidebarToggle() {
  const { collapsed, toggle } = useSidebar();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={collapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
      title={collapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
      onClick={toggle}
      className="hidden lg:inline-flex"
    >
      {collapsed ? (
        <PanelLeftOpen className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );
}
