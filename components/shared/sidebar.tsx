import Link from 'next/link';
import { SidebarNav } from './sidebar-nav';

export function Sidebar() {
  return (
    <aside
      className="hidden h-screen w-60 shrink-0 flex-col border-r p-4 lg:flex"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-subtle)',
      }}
    >
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2 px-2 text-sm font-semibold tracking-tight"
      >
        <span className="h-6 w-6 rounded-md bg-[var(--brand)]" aria-hidden />
        Bimbingo
      </Link>
      <SidebarNav />
      <div className="mt-auto pt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        v0.1 · MVP
      </div>
    </aside>
  );
}
