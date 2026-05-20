import { PageHeaderSkeleton } from '@/components/shared/page-header-skeleton';
import { TableSkeleton } from '@/components/shared/table-skeleton';

export default function ClientsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}
