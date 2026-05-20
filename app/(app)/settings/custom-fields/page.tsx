import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CF_ENTITY_LABEL, CF_ENTITY_TYPES } from '@/lib/schemas/custom-field';

export default function CustomFieldsHubPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Pengaturan
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Custom Fields</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Tambah kolom data sendiri per entitas. Mirip Jira / ClickUp / Notion.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CF_ENTITY_TYPES.map((entity) => (
          <Link key={entity} href={`/settings/custom-fields/${entity}`} className="block">
            <Card className="transition-colors hover:bg-[var(--bg-muted)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{CF_ENTITY_LABEL[entity]}</CardTitle>
                  <CardDescription>Kelola field tambahan untuk {CF_ENTITY_LABEL[entity].toLowerCase()}.</CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
