import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FinanceStats } from '@/components/payments/finance-stats';
import { PaymentsTable } from '@/components/payments/payments-table';
import { getProject } from '@/lib/actions/projects';
import { listPaymentsByProject } from '@/lib/actions/payments';
import { listCustomFields } from '@/lib/actions/custom-fields';

export const dynamic = 'force-dynamic';

export default async function ProjectFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [projectResult, paymentsResult, cfResult] = await Promise.all([
    getProject(id),
    listPaymentsByProject(id),
    listCustomFields('payment'),
  ]);

  if (!projectResult.ok || !projectResult.data) notFound();
  const { project, finance } = projectResult.data;
  const payments = paymentsResult.ok ? paymentsResult.data : [];
  const paymentFields = cfResult.ok ? cfResult.data.filter((f) => !f.archived_at) : [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Detail proyek
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Pencatatan termin & ringkasan keuangan proyek ini.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/invoice/${id}`} target="_blank" rel="noreferrer">
            <Printer className="h-4 w-4" />
            Cetak invoice
          </Link>
        </Button>
      </div>

      <FinanceStats
        totalValue={project.total_value}
        totalPaid={finance.total_paid}
        outstanding={finance.outstanding}
        paymentCount={finance.payment_count}
      />

      <Card>
        <CardHeader>
          <CardTitle>Riwayat pembayaran</CardTitle>
          <CardDescription>
            Setiap entry mengurangi sisa piutang. Verified = bukti sudah dicek dengan rekening.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable projectId={id} initial={payments} customFields={paymentFields} />
        </CardContent>
      </Card>
    </div>
  );
}
