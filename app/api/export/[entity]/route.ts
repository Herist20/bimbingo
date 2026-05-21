import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { csvFilename, toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

type Entity = 'clients' | 'projects' | 'payments';

const ENTITIES: Entity[] = ['clients', 'projects', 'payments'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;
  if (!ENTITIES.includes(entity as Entity)) {
    return NextResponse.json({ error: 'Entitas tidak didukung' }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Tidak terotorisasi' }, { status: 401 });
  }

  try {
    const csv = await buildCsv(entity as Entity, supabase, request.nextUrl.searchParams);
    const filename = csvFilename(entity);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal generate CSV';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function buildCsv(
  entity: Entity,
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  searchParams: URLSearchParams,
): Promise<string> {
  if (entity === 'clients') {
    const { data, error } = await supabase
      .from('clients')
      .select(
        'full_name, nickname, whatsapp, email, university, faculty, major, student_id, semester, target_defense, source, notes, archived_at, created_at',
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    return toCsv(data ?? [], [
      { key: 'full_name', label: 'Nama' },
      { key: 'nickname', label: 'Panggilan' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'email', label: 'Email' },
      { key: 'university', label: 'Kampus' },
      { key: 'faculty', label: 'Fakultas' },
      { key: 'major', label: 'Jurusan' },
      { key: 'student_id', label: 'NIM' },
      { key: 'semester', label: 'Semester' },
      { key: 'target_defense', label: 'Target sidang' },
      { key: 'source', label: 'Sumber' },
      { key: 'notes', label: 'Catatan' },
      { key: 'archived_at', label: 'Diarsipkan' },
      { key: 'created_at', label: 'Tanggal masuk' },
    ]);
  }

  if (entity === 'projects') {
    const { data, error } = await supabase
      .from('projects')
      .select(
        `id, title, type, status, total_value, start_date, target_end_date, actual_end_date, archived_at, created_at,
         client:clients!inner(full_name, whatsapp)`,
      )
      .order('created_at', { ascending: false });
    if (error) throw error;

    const flat = (data ?? []).map((p) => {
      const client = (p as unknown as { client?: { full_name?: string; whatsapp?: string } }).client;
      return {
        title: p.title,
        type: p.type,
        status: p.status,
        client_name: client?.full_name ?? '',
        client_whatsapp: client?.whatsapp ?? '',
        total_value: p.total_value,
        start_date: p.start_date,
        target_end_date: p.target_end_date,
        actual_end_date: p.actual_end_date,
        archived_at: p.archived_at,
        created_at: p.created_at,
      };
    });

    return toCsv(flat, [
      { key: 'title', label: 'Judul' },
      { key: 'type', label: 'Tipe' },
      { key: 'status', label: 'Status' },
      { key: 'client_name', label: 'Klien' },
      { key: 'client_whatsapp', label: 'WA klien' },
      { key: 'total_value', label: 'Nilai kontrak' },
      { key: 'start_date', label: 'Mulai' },
      { key: 'target_end_date', label: 'Target selesai' },
      { key: 'actual_end_date', label: 'Selesai aktual' },
      { key: 'archived_at', label: 'Diarsipkan' },
      { key: 'created_at', label: 'Dibuat' },
    ]);
  }

  // payments
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase
    .from('payments')
    .select(
      `id, amount, paid_at, method, reference, installment_label, verified, notes, created_at,
       project:projects!inner(title, client:clients!inner(full_name))`,
    )
    .order('paid_at', { ascending: false });

  if (from) query = query.gte('paid_at', from);
  if (to) query = query.lte('paid_at', to);

  const { data, error } = await query;
  if (error) throw error;

  const flat = (data ?? []).map((p) => {
    const proj = (p as unknown as {
      project?: { title?: string; client?: { full_name?: string } };
    }).project;
    return {
      paid_at: p.paid_at,
      amount: p.amount,
      method: p.method,
      installment_label: p.installment_label,
      reference: p.reference,
      project_title: proj?.title ?? '',
      client_name: proj?.client?.full_name ?? '',
      verified: p.verified ? 'ya' : 'tidak',
      notes: p.notes,
      created_at: p.created_at,
    };
  });

  return toCsv(flat, [
    { key: 'paid_at', label: 'Tanggal' },
    { key: 'amount', label: 'Nominal' },
    { key: 'method', label: 'Metode' },
    { key: 'installment_label', label: 'Label termin' },
    { key: 'reference', label: 'Referensi' },
    { key: 'project_title', label: 'Proyek' },
    { key: 'client_name', label: 'Klien' },
    { key: 'verified', label: 'Verified' },
    { key: 'notes', label: 'Catatan' },
    { key: 'created_at', label: 'Tercatat' },
  ]);
}
