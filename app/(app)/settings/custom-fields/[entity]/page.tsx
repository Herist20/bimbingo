import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldsManager } from '@/components/custom-fields/fields-manager';
import { listCustomFields } from '@/lib/actions/custom-fields';
import {
  CF_ENTITY_LABEL,
  CF_ENTITY_TYPES,
  type CFEntityType,
} from '@/lib/schemas/custom-field';

export const dynamic = 'force-dynamic';

export default async function CustomFieldsForEntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity } = await params;
  if (!(CF_ENTITY_TYPES as readonly string[]).includes(entity)) notFound();
  const entityType = entity as CFEntityType;

  // Include archived untuk tampil di tab "arsip" — kita ambil semua lalu UI filter
  const supabaseFields = await listCustomFields(entityType);
  const fields = supabaseFields.ok ? supabaseFields.data : [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/settings/custom-fields"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Daftar entitas
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Custom Fields — {CF_ENTITY_LABEL[entityType]}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Kolom kustom akan tampil di form {CF_ENTITY_LABEL[entityType].toLowerCase()}{' '}
          dan dapat dipakai untuk filter / sort di list view.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field</CardTitle>
          <CardDescription>
            Tipe field tidak dapat diubah setelah ada data — arsipkan & buat baru bila perlu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldsManager entityType={entityType} initial={fields} />
        </CardContent>
      </Card>
    </div>
  );
}
