import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== '42P01') {
      throw error;
    }
    return NextResponse.json({ status: 'ok', ts: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: (err as Error).message },
      { status: 503 },
    );
  }
}
