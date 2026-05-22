import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PortalProfilePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from('clients')
    .select('full_name, email, whatsapp, university, faculty, major')
    .eq('client_user_id', user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Data ini dikelola admin. Hubungi pembimbing jika ada yang perlu diubah.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" value={client?.full_name ?? '—'} />
          <Field label="Email" value={client?.email ?? '—'} />
          <Field label="WhatsApp" value={client?.whatsapp ?? '—'} />
          <Field label="Kampus" value={client?.university ?? '—'} />
          <Field label="Fakultas" value={client?.faculty ?? '—'} />
          <Field label="Jurusan" value={client?.major ?? '—'} />
        </CardContent>
      </Card>

      <form action="/auth/sign-out" method="post">
        <Button type="submit" variant="secondary">
          Keluar
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
