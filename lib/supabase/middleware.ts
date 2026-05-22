import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

const ADMIN_PROTECTED_PREFIXES = [
  '/dashboard',
  '/clients',
  '/projects',
  '/lecturers',
  '/finance',
  '/settings',
];

const PORTAL_PREFIX = '/portal';
const PORTAL_LOGIN = '/portal/login';
const PORTAL_CALLBACK = '/portal/auth/callback';

const ROLE_COOKIE = 'bm_role';
const ROLE_COOKIE_TTL_SECONDS = 300;

function isAdminProtected(pathname: string) {
  return ADMIN_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function isPortalProtected(pathname: string) {
  if (!pathname.startsWith(PORTAL_PREFIX)) return false;
  if (pathname === PORTAL_LOGIN) return false;
  if (pathname.startsWith(PORTAL_CALLBACK)) return false;
  return true;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user) {
    if (isAdminProtected(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (isPortalProtected(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = PORTAL_LOGIN;
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Authenticated — resolve role (cookie cache or DB lookup)
  let role = request.cookies.get(ROLE_COOKIE)?.value;
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = profile?.role ?? 'admin';
    response.cookies.set(ROLE_COOKIE, role, {
      maxAge: ROLE_COOKIE_TTL_SECONDS,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  if (role === 'client') {
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/portal';
      return NextResponse.redirect(url);
    }
    if (isAdminProtected(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/portal';
      return NextResponse.redirect(url);
    }
    if (pathname === PORTAL_LOGIN) {
      const url = request.nextUrl.clone();
      url.pathname = '/portal';
      return NextResponse.redirect(url);
    }
  } else {
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    if (isPortalProtected(pathname) || pathname === PORTAL_LOGIN) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
