import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-[var(--brand)]" />
        <span className="text-lg font-semibold tracking-tight">Bimbingo</span>
      </div>
      {children}
    </div>
  );
}
