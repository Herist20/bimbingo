import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { getProject } from '@/lib/actions/projects';
import { listPaymentsByProject } from '@/lib/actions/payments';
import { getServerSupabase } from '@/lib/supabase/server';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/lib/schemas/payment';
import { PrintTrigger } from '@/components/invoice/print-trigger';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Invoice',
};

function invoiceNumber(projectId: string, createdAt: string) {
  const date = new Date(createdAt);
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `INV/${ym}/${projectId.slice(0, 8).toUpperCase()}`;
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, projectResult, paymentsResult] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('full_name, phone, role')
          .eq('id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getProject(projectId),
    listPaymentsByProject(projectId),
  ]);

  if (!projectResult.ok || !projectResult.data) notFound();

  const { project, finance } = projectResult.data;
  const payments = paymentsResult.ok ? paymentsResult.data : [];
  const sortedPayments = [...payments].sort((a, b) => a.paid_at.localeCompare(b.paid_at));

  const invoiceNo = invoiceNumber(project.id, project.created_at);
  const issuedAt = new Date();
  const merchantName = profile?.full_name ?? user?.email ?? 'Bimbingo Admin';

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8 print:py-0">
      {/* Toolbar — screen only */}
      <div className="no-print flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm">
        <Link
          href={`/projects/${project.id}/finance`}
          className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke keuangan
        </Link>
        <PrintTrigger />
      </div>

      {/* Invoice sheet */}
      <article
        className="print-shell flex flex-col gap-6 rounded-lg border border-[var(--border)] bg-white p-10 text-[13px] leading-relaxed text-[#1a1310] shadow-sm print:gap-5 print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        {/* Header */}
        <header className="flex items-start justify-between border-b border-[#d8c6a8] pb-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-md bg-[#c45c2e] text-white"
            >
              <span className="font-display text-xl font-bold">B</span>
            </span>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-semibold leading-tight tracking-tight">
                Bimbingo
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#8a7a6b]">
                Studio Almanak · jasa pendampingan skripsi
              </span>
              <span className="mt-1 text-[11px] text-[#5a4a3e]">
                {merchantName}
                {profile?.phone ? ` · ${profile.phone}` : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c45c2e]">
              Invoice
            </span>
            <span className="font-mono text-base font-semibold">{invoiceNo}</span>
            <span className="mt-2 text-[11px] text-[#5a4a3e]">
              Diterbitkan: {formatTanggal(issuedAt.toISOString())}
            </span>
          </div>
        </header>

        {/* Parties */}
        <section className="grid grid-cols-2 gap-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a6b]">
              Ditagihkan kepada
            </span>
            <p className="mt-1 font-semibold">{project.client?.full_name ?? '—'}</p>
            {project.client?.whatsapp ? (
              <p className="font-mono text-xs text-[#5a4a3e]">{project.client.whatsapp}</p>
            ) : null}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a6b]">
              Proyek
            </span>
            <p className="mt-1 font-semibold">{project.title}</p>
            <p className="text-xs text-[#5a4a3e]">
              {project.start_date ? `Mulai ${formatTanggal(project.start_date)}` : '—'}
              {project.target_end_date ? ` · target ${formatTanggal(project.target_end_date)}` : ''}
            </p>
          </div>
        </section>

        {/* Line items */}
        <section className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a6b]">
            Rincian pembayaran
          </span>
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#d8c6a8] text-[10px] uppercase tracking-[0.12em] text-[#8a7a6b]">
                <th className="py-2">Tanggal</th>
                <th className="py-2">Keterangan</th>
                <th className="py-2">Metode</th>
                <th className="py-2 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-[#8a7a6b]"
                  >
                    Belum ada pembayaran tercatat.
                  </td>
                </tr>
              ) : (
                sortedPayments.map((p) => (
                  <tr key={p.id} className="border-b border-[#eadcc4]">
                    <td className="py-2 align-top">{formatTanggal(p.paid_at)}</td>
                    <td className="py-2 align-top">
                      <span className="font-medium">
                        {p.installment_label ?? 'Pembayaran termin'}
                      </span>
                      {p.reference ? (
                        <span className="block font-mono text-[10px] text-[#8a7a6b]">
                          Ref: {p.reference}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 align-top">
                      {PAYMENT_METHOD_LABEL[p.method as PaymentMethod] ?? p.method}
                    </td>
                    <td className="py-2 text-right align-top font-medium">
                      {formatRupiah(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-[12px]">
            <Row label="Nilai kontrak" value={formatRupiah(project.total_value)} />
            <Row label="Sudah dibayar" value={formatRupiah(finance.total_paid)} />
            <div
              className="flex items-center justify-between border-t border-[#d8c6a8] pt-2 text-sm font-semibold"
            >
              <span>Sisa piutang</span>
              <span style={{ color: finance.outstanding > 0 ? '#c45c2e' : '#5a7a3e' }}>
                {formatRupiah(finance.outstanding)}
              </span>
            </div>
          </dl>
        </section>

        {/* Notes */}
        {project.description ? (
          <section>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a6b]">
              Catatan
            </span>
            <p className="mt-1 whitespace-pre-line text-[12px] text-[#5a4a3e]">
              {project.description}
            </p>
          </section>
        ) : null}

        {/* Signature & footer */}
        <footer className="mt-6 grid grid-cols-2 gap-6 border-t border-[#d8c6a8] pt-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a6b]">
              Pembayaran ke
            </span>
            <p className="mt-1 text-[12px]">
              Sesuai metode yang disepakati di chat. Mohon transfer ke rekening yang tertera
              pada pesan WhatsApp / kontrak.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a6b]">
              Hormat kami
            </span>
            <div className="mt-10 h-px w-40 bg-[#1a1310]" />
            <span className="mt-1 text-[12px] font-medium">{merchantName}</span>
            <span className="text-[10px] text-[#8a7a6b]">Pendamping</span>
          </div>
        </footer>

        {/* Meta */}
        <div className="border-t border-[#eadcc4] pt-3 text-center text-[9px] uppercase tracking-[0.22em] text-[#8a7a6b]">
          Bimbingo · invoice #{invoiceNo} · {formatTanggal(issuedAt.toISOString())} ·{' '}
          {payments.length} transaksi
        </div>
      </article>

      <p className="no-print text-center text-[11px] text-[var(--text-muted)]">
        Tekan <kbd className="kbd">Ctrl</kbd> +{' '}
        <kbd className="kbd">P</kbd> (Windows) atau{' '}
        <kbd className="kbd">⌘</kbd> + <kbd className="kbd">P</kbd> (Mac) untuk simpan
        sebagai PDF.
        <Printer className="ml-1 inline h-3 w-3" />
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <dt className="text-[#5a4a3e]">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
