'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const Icon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ubah tema">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setTheme('light')}>
          <Sun className="h-4 w-4" />
          Terang
          {theme === 'light' ? <span className="ml-auto text-xs">●</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme('dark')}>
          <Moon className="h-4 w-4" />
          Gelap
          {theme === 'dark' ? <span className="ml-auto text-xs">●</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme('system')}>
          <Monitor className="h-4 w-4" />
          Sistem
          {theme === 'system' ? <span className="ml-auto text-xs">●</span> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
