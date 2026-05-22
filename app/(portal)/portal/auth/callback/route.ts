import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/portal';

  const supabase = await getServerSupabase();

  // Recommended: token_hash flow (set di email template Invite User Supabase)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return redirectTo(request, next);
    return redirectToLogin(request, 'invite_expired');
  }

  // PKCE code flow fallback
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectTo(request, next);
    return redirectToLogin(request, 'invite_expired');
  }

  // Default: implicit/hash flow. Hash fragment hanya tersedia di browser,
  // jadi server tidak bisa baca. Render HTML kecil yang ambil token dari
  // hash, set session via supabase-js, lalu redirect ke portal.
  return new NextResponse(htmlHashFlow(), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function htmlHashFlow() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Bimbingo Portal</title></head>
<body style="font-family:system-ui;padding:24px;text-align:center;">
<p>Mengaktifkan sesi…</p>
<script type="module">
import { createBrowserClient } from 'https://esm.sh/@supabase/ssr@0.5.2';
(async () => {
  try {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) {
      window.location.replace('/portal/login?error=invite_invalid');
      return;
    }
    const sb = createBrowserClient(${JSON.stringify(supabaseUrl)}, ${JSON.stringify(supabaseAnonKey)});
    const { error } = await sb.auth.setSession({ access_token, refresh_token });
    if (error) {
      window.location.replace('/portal/login?error=invite_invalid');
      return;
    }
    window.location.replace('/portal');
  } catch (e) {
    console.error('[invite callback]', e);
    window.location.replace('/portal/login?error=invite_invalid');
  }
})();
</script>
<noscript>JavaScript dibutuhkan untuk menyelesaikan aktivasi portal.</noscript>
</body>
</html>`;
}

function redirectTo(request: NextRequest, path: string) {
  const dest = request.nextUrl.clone();
  dest.pathname = path.startsWith('/') ? path : `/${path}`;
  dest.search = '';
  dest.hash = '';
  return NextResponse.redirect(dest);
}

function redirectToLogin(request: NextRequest, error: string) {
  const dest = request.nextUrl.clone();
  dest.pathname = '/portal/login';
  dest.search = '';
  dest.hash = '';
  dest.searchParams.set('error', error);
  return NextResponse.redirect(dest);
}
