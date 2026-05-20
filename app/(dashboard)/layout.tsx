export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
      <aside
        className="hidden border-r p-4 lg:block"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
      >
        <div className="mb-6 text-sm font-semibold">Bimbingo</div>
        <nav className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div>Dashboard</div>
          <div>Klien</div>
          <div>Proyek</div>
          <div>Dosen</div>
          <div>Finance</div>
          <div>Settings</div>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
