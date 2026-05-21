'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS } from './nav-items';
import { useSidebar } from './sidebar-context';

interface SidebarNavProps {
  onNavigate?: () => void;
  /** Force expanded (override context). Dipakai di mobile sheet. */
  forceExpanded?: boolean;
}

export function SidebarNav({ onNavigate, forceExpanded }: SidebarNavProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <nav className={cn('flex flex-col', isCollapsed ? 'gap-3' : 'gap-5')}>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          {!isCollapsed ? (
            <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {section.label}
            </span>
          ) : (
            <span
              aria-hidden
              className="mx-2 h-px bg-[var(--border)]"
            />
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-md text-sm transition-colors',
                    isCollapsed ? 'h-9 w-9 justify-center self-center' : 'px-2.5 py-1.5',
                    active
                      ? 'bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
                  )}
                  aria-current={active ? 'page' : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                >
                  {active && !isCollapsed ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--brand)]"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]',
                    )}
                    aria-hidden
                  />
                  {!isCollapsed ? (
                    <span className={cn('truncate', active && 'font-medium')}>{item.label}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
