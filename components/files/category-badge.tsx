import { Badge } from '@/components/ui/badge';
import { FILE_CATEGORY_LABEL, FILE_CATEGORY_TONE } from '@/lib/schemas/file';

export function FileCategoryBadge({ category }: { category: string | null }) {
  const c = (category ?? 'lainnya') as keyof typeof FILE_CATEGORY_LABEL;
  return (
    <Badge tone={FILE_CATEGORY_TONE[c] ?? 'neutral'}>
      {FILE_CATEGORY_LABEL[c] ?? category ?? 'Lainnya'}
    </Badge>
  );
}
