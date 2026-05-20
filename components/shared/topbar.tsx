import { MobileSidebar } from './mobile-sidebar';
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
      className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4 backdrop-blur"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'color-mix(in oklab, var(--bg-base) 80%, transparent)',
      }}
    >
      <MobileSidebar />

      <div className="flex-1" />

      <ThemeToggle />
      <UserMenu email={email} fullName={fullName} avatarUrl={avatarUrl} />
    </header>
  );
}
