import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings/profile" className="block">
          <Card className="transition-colors hover:bg-[var(--bg-muted)]">
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Nama, avatar, kontak admin.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-secondary)]">
              Atur tampilan profil yang dipakai di sistem.
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/custom-fields" className="block">
          <Card className="transition-colors hover:bg-[var(--bg-muted)]">
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>Tambah kolom data sendiri per entitas.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-secondary)]">
              Mirip Jira / ClickUp / Notion. Tambah field text, angka, pilihan, dll.
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
            <CardDescription>Gunakan toggle di topbar.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--text-secondary)]">
            Tema (terang/gelap/sistem) diatur dari ikon di kanan atas.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
