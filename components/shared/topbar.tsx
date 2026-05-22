import { Breadcrumbs } from './breadcrumbs';
import { CommandTrigger } from './command-trigger';
import { InboxBell } from './inbox-bell';
import { MobileSidebar } from './mobile-sidebar';
import { NotificationBell } from './notification-bell';
import { SidebarToggle } from './sidebar-toggle';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

interface TopbarProps {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export function Topbar({ email, fullName, avatarUrl }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b px-4"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-subtle)',
      }}
    >
      <MobileSidebar />
      <SidebarToggle />
      <Breadcrumbs />
      <div className="flex-1" />
      <CommandTrigger />
      <InboxBell />
      <NotificationBell />
      <ThemeToggle />
      <UserMenu email={email} fullName={fullName} avatarUrl={avatarUrl} />
    </header>
  );
}
