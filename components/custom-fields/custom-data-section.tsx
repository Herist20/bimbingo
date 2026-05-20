import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomFieldCell } from './custom-field-cell';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';

interface CustomDataSectionProps {
  fields: CustomFieldRow[];
  data: Record<string, unknown>;
  title?: string;
  description?: string;
}

export function CustomDataSection({
  fields,
  data,
  title = 'Field tambahan',
  description = 'Data yang Anda tambahkan via custom fields.',
}: CustomDataSectionProps) {
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {field.label}
            </span>
            <CustomFieldCell field={field} value={data[field.key]} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
