import { NextResponse, type NextRequest } from 'next/server';

import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const supabase = await getServerSupabase();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const failUrl = url.clone();
      failUrl.pathname = '/portal/login';
      failUrl.search = '';
      failUrl.searchParams.set('error', 'invite_expired');
      return NextResponse.redirect(failUrl);
    }
  }

  const home = url.clone();
  home.pathname = '/portal';
  home.search = '';
  return NextResponse.redirect(home);
}
