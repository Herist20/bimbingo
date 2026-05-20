import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS_LABEL } from '@/lib/schemas/project';

const TONE: Record<string, 'brand' | 'success' | 'warning' | 'neutral' | 'danger'> = {
  draft: 'neutral',
  active: 'brand',
  'on-hold': 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const label =
    (PROJECT_STATUS_LABEL as Record<string, string>)[status] ?? status;
  const tone = TONE[status] ?? 'neutral';
  return <Badge tone={tone}>{label}</Badge>;
}
