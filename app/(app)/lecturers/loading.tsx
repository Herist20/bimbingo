import { PageHeaderSkeleton } from '@/components/shared/page-header-skeleton';
import { TableSkeleton } from '@/components/shared/table-skeleton';

export default function LecturersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
