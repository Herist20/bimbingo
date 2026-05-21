import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { AuditList } from '@/components/audit/audit-list';
import { listAuditLogs } from '@/lib/actions/audit';

export const dynamic = 'force-dynamic';

interface SearchParams {
  entity_type?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: string;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filter = {
    entity_type: params.entity_type,
    action: params.action,
    from: params.from,
    to: params.to,
    page: params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1,
  };

  const result = await listAuditLogs(filter);
  const payload = result.ok
    ? result.data
    : {
        rows: [],
        total: 0,
        page: 1,
        pageSize: 25,
        entityTypes: [],
        actions: [],
      };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <Link
        href="/settings"
        className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Pengaturan
      </Link>

      <PageHeader
        kicker="Pengaturan · Audit log"
        title="Jejak perubahan"
        description="Riwayat aksi yang ter-rekam otomatis oleh trigger DB. Pakai untuk debugging atau verifikasi perubahan status proyek."
        meta={
          <>
            <span className="chip chip-brand">{payload.total} entry</span>
            <span className="chip">audit_logs · Postgres trigger</span>
          </>
        }
      />

      <AuditList
        initial={payload}
        initialFilter={{
          entity_type: params.entity_type,
          action: params.action,
          from: params.from,
          to: params.to,
          page: filter.page,
        }}
      />
    </div>
  );
}
