# Client Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buka akses read-only self-service untuk klien (mahasiswa skripsi) di `/portal/*` — lihat progres proyek, milestones, dan riwayat pembayaran. Admin invite via email OTP.

**Architecture:** Next.js App Router route group `app/(portal)/*` dengan layout terpisah (tanpa sidebar admin). Auth: Supabase admin `inviteUserByEmail` + email OTP code login (`shouldCreateUser: false`). Role distinction via `profiles.role = 'client'`. Link klien↔auth via kolom `clients.client_user_id`. RLS policies baru per tabel domain (clients, projects, project_milestones, payments) untuk filter ke milik klien.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (Postgres + Auth), Tailwind v4, shadcn/ui, Vitest. Service-role hanya di server action admin-gated.

**Spec reference:** `docs/superpowers/specs/2026-05-22-client-portal-design.md`.

---

## File Structure

### Files to create
- `supabase/migrations/20260522000001_client_portal.sql` — schema + RLS migration
- `lib/schemas/portal.ts` — zod schemas (invite, OTP request, OTP verify)
- `lib/actions/portal.ts` — server actions (invite, revoke, requestOtp, verifyOtp)
- `app/(portal)/layout.tsx` — minimal wrapper (ThemeProvider/Toaster)
- `app/(portal)/portal/layout.tsx` — portal shell with `<PortalHeader />`
- `app/(portal)/portal/page.tsx` — dashboard ringkas
- `app/(portal)/portal/login/page.tsx` — email + OTP 2-step form
- `app/(portal)/portal/proyek/[id]/page.tsx` — detail proyek
- `app/(portal)/portal/pembayaran/page.tsx` — riwayat pembayaran
- `app/(portal)/portal/profile/page.tsx` — read-only profile
- `app/(portal)/portal/auth/callback/route.ts` — OTP/invite callback handler
- `components/portal/portal-header.tsx` — header with nav + logout
- `components/portal/project-card.tsx` — dashboard card
- `components/portal/milestone-list.tsx` — milestone rows
- `components/portal/payment-status-badge.tsx` — verified badge
- `components/clients/invite-portal-button.tsx` — admin-side invite trigger
- `components/clients/revoke-portal-button.tsx` — admin-side revoke trigger (with AlertDialog)
- `lib/schemas/__tests__/portal.test.ts` — unit tests for zod schemas
- `lib/actions/__tests__/portal.test.ts` — unit test for invite/revoke happy path
- `tests/rls/portal.sql` — RLS smoke test (manual run via psql)

### Files to modify
- `lib/supabase/middleware.ts` — extend `updateSession` with role-based redirect
- `app/(app)/clients/[id]/page.tsx` — add "Akses Portal" section
- `types/database.ts` — auto-regenerated via `pnpm db:types`

---

## Phase 1 — Schema & Migration

### Task 1: Write migration SQL

**Files:**
- Create: `supabase/migrations/20260522000001_client_portal.sql`

- [ ] **Step 1: Write migration file**

```sql
-- 20260522000001_client_portal.sql
-- Adds 'client' role + client_user_id link + RLS policies for portal access.

-- 1. Extend profiles.role enum (add 'client')
alter table public.profiles
  drop constraint profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin','assistant','viewer','client'));

-- 2. Link auth.users -> clients (1:1 nullable)
alter table public.clients
  add column client_user_id uuid unique
    references auth.users(id) on delete set null;

create index idx_clients_client_user_id
  on public.clients(client_user_id)
  where client_user_id is not null;

-- 3. Extend handle_new_user trigger: read role + name from metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'admin');
  v_full_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, v_full_name, v_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4. RLS: client reads own clients row
create policy "client reads own clients row"
  on public.clients
  for select to authenticated
  using (client_user_id = auth.uid());

-- 5. RLS: client reads own projects
create policy "client reads own projects"
  on public.projects
  for select to authenticated
  using (
    client_id in (
      select id from public.clients
      where client_user_id = auth.uid()
    )
  );

-- 6. RLS: client reads project_milestones of own projects
create policy "client reads own project_milestones"
  on public.project_milestones
  for select to authenticated
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.client_user_id = auth.uid()
    )
  );

-- 7. RLS: client reads own payments
create policy "client reads own payments"
  on public.payments
  for select to authenticated
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.client_user_id = auth.uid()
    )
  );
```

**Important:** File must be **UTF-8 without BOM** (CLAUDE.md §5 — Postgres rejects BOM with SQLSTATE 42601). Use the Edit/Write tool which writes UTF-8 without BOM by default.

- [ ] **Step 2: Apply migration to local/linked Supabase**

Run: `pnpm supabase db push`
Expected: migration accepted, no errors. If "BOM" error → re-save file with UTF-8 (no BOM).

- [ ] **Step 3: Regenerate types**

Run: `pnpm db:types`
Expected: `types/database.ts` updated. `clients.client_user_id: string | null` should appear in the `Tables<'clients'>` definition.

- [ ] **Step 4: Verify in SQL editor**

Run in Supabase SQL editor:
```sql
select column_name, data_type from information_schema.columns
  where table_name = 'clients' and column_name = 'client_user_id';
select pg_get_constraintdef(c.oid) from pg_constraint c
  where conname = 'profiles_role_check';
select policyname from pg_policies
  where tablename in ('clients','projects','project_milestones','payments')
  and policyname like 'client reads%';
```
Expected: 1 column row, constraint includes 'client', 4 policy rows.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260522000001_client_portal.sql types/database.ts
git commit -m "feat(portal): schema + RLS for client portal access"
```

---

## Phase 2 — Validation Schemas

### Task 2: zod schemas

**Files:**
- Create: `lib/schemas/portal.ts`
- Test: `lib/schemas/__tests__/portal.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/schemas/__tests__/portal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  InviteClientSchema,
  RequestPortalOtpSchema,
  VerifyPortalOtpSchema,
} from '@/lib/schemas/portal';

describe('InviteClientSchema', () => {
  it('accepts valid uuid', () => {
    const r = InviteClientSchema.safeParse({ clientId: 'a3bb189e-8bf9-3888-9912-ace4e6543002' });
    expect(r.success).toBe(true);
  });
  it('rejects non-uuid', () => {
    const r = InviteClientSchema.safeParse({ clientId: 'not-a-uuid' });
    expect(r.success).toBe(false);
  });
});

describe('RequestPortalOtpSchema', () => {
  it('accepts valid email', () => {
    const r = RequestPortalOtpSchema.safeParse({ email: 'klien@example.com' });
    expect(r.success).toBe(true);
  });
  it('rejects invalid email', () => {
    const r = RequestPortalOtpSchema.safeParse({ email: 'bukan-email' });
    expect(r.success).toBe(false);
  });
});

describe('VerifyPortalOtpSchema', () => {
  it('accepts 6-digit numeric token', () => {
    const r = VerifyPortalOtpSchema.safeParse({
      email: 'klien@example.com',
      token: '123456',
    });
    expect(r.success).toBe(true);
  });
  it('rejects non-numeric token', () => {
    const r = VerifyPortalOtpSchema.safeParse({
      email: 'klien@example.com',
      token: '12abcd',
    });
    expect(r.success).toBe(false);
  });
  it('rejects wrong length token', () => {
    const r = VerifyPortalOtpSchema.safeParse({
      email: 'klien@example.com',
      token: '12345',
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test lib/schemas/__tests__/portal.test.ts`
Expected: FAIL with "Cannot find module '@/lib/schemas/portal'".

- [ ] **Step 3: Write schemas**

Create `lib/schemas/portal.ts`:

```ts
import { z } from 'zod';

export const InviteClientSchema = z.object({
  clientId: z.string().uuid('Client ID tidak valid'),
});
export type InviteClientInput = z.infer<typeof InviteClientSchema>;

export const RequestPortalOtpSchema = z.object({
  email: z.string().email('Email tidak valid'),
});
export type RequestPortalOtpInput = z.infer<typeof RequestPortalOtpSchema>;

export const VerifyPortalOtpSchema = z.object({
  email: z.string().email('Email tidak valid'),
  token: z
    .string()
    .length(6, 'OTP harus 6 digit')
    .regex(/^\d+$/, 'OTP harus 6 digit angka'),
});
export type VerifyPortalOtpInput = z.infer<typeof VerifyPortalOtpSchema>;

export const RevokeClientPortalSchema = InviteClientSchema;
export type RevokeClientPortalInput = z.infer<typeof RevokeClientPortalSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/schemas/__tests__/portal.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/portal.ts lib/schemas/__tests__/portal.test.ts
git commit -m "feat(portal): zod schemas for invite + OTP flow"
```

---

## Phase 3 — Server Actions

### Task 3: Portal server actions (invite, revoke, requestOtp, verifyOtp)

**Files:**
- Create: `lib/actions/portal.ts`

**Note:** Tidak ada unit test untuk server action ini di task ini — testing dilakukan via manual smoke test (Task 15). `inviteUserByEmail` butuh mocking yang kompleks, di luar value/effort.

- [ ] **Step 1: Read getAdminSupabase signature**

Check `lib/supabase/admin.ts` — confirm export name (likely `getAdminSupabase`).

- [ ] **Step 2: Write portal action file**

Create `lib/actions/portal.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';

import {
  ActionError,
  fail,
  ok,
  requireUser,
  type ActionResult,
} from './_helper';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  InviteClientSchema,
  RequestPortalOtpSchema,
  RevokeClientPortalSchema,
  VerifyPortalOtpSchema,
} from '@/lib/schemas/portal';

export async function inviteClientToPortal(
  input: unknown,
): Promise<ActionResult<{ userId: string }>> {
  try {
    await requireUser();
    const parsed = InviteClientSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Input tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const { clientId } = parsed.data;

    const supabase = await getServerSupabase();
    const { data: client, error: e1 } = await supabase
      .from('clients')
      .select('id, email, full_name, client_user_id')
      .eq('id', clientId)
      .single();
    if (e1) throw e1;
    if (!client) throw new ActionError('not_found', 'Klien tidak ditemukan');
    if (!client.email) {
      throw new ActionError(
        'validation_error',
        'Klien belum punya email. Tambahkan email dulu sebelum mengaktifkan portal.',
      );
    }
    if (client.client_user_id) {
      throw new ActionError(
        'conflict',
        'Klien sudah punya akses portal.',
      );
    }

    const admin = getAdminSupabase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const { data: invited, error: e2 } = await admin.auth.admin.inviteUserByEmail(
      client.email,
      {
        data: { role: 'client', full_name: client.full_name },
        redirectTo: `${appUrl}/portal/auth/callback`,
      },
    );
    if (e2) {
      if (e2.message?.toLowerCase().includes('already registered')) {
        throw new ActionError(
          'conflict',
          'Email ini sudah dipakai akun lain. Gunakan email berbeda untuk klien.',
        );
      }
      throw e2;
    }
    if (!invited.user) throw new ActionError('internal', 'Gagal membuat akun klien.');

    const { error: e3 } = await supabase
      .from('clients')
      .update({ client_user_id: invited.user.id })
      .eq('id', clientId);
    if (e3) throw e3;

    revalidatePath(`/clients/${clientId}`);
    return ok({ userId: invited.user.id });
  } catch (e) {
    return fail(e);
  }
}

export async function revokeClientPortalAccess(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const parsed = RevokeClientPortalSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Input tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const { clientId } = parsed.data;

    const supabase = await getServerSupabase();
    const { data: client, error: e1 } = await supabase
      .from('clients')
      .select('id, client_user_id')
      .eq('id', clientId)
      .single();
    if (e1) throw e1;
    if (!client) throw new ActionError('not_found', 'Klien tidak ditemukan');
    if (!client.client_user_id) {
      throw new ActionError('conflict', 'Klien belum punya akses portal.');
    }

    const admin = getAdminSupabase();
    const { error: e2 } = await admin.auth.admin.deleteUser(client.client_user_id);
    if (e2) throw e2;

    const { error: e3 } = await supabase
      .from('clients')
      .update({ client_user_id: null })
      .eq('id', clientId);
    if (e3) throw e3;

    revalidatePath(`/clients/${clientId}`);
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

export async function requestPortalOtp(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const parsed = RequestPortalOtpSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Email tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      // Generic message agar tidak leak email enumeration
      throw new ActionError(
        'internal',
        'Gagal mengirim kode. Pastikan email Anda terdaftar dan coba lagi.',
      );
    }
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

export async function verifyPortalOtp(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const parsed = VerifyPortalOtpSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'OTP tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.token,
      type: 'email',
    });
    if (error) {
      throw new ActionError(
        'unauthorized',
        'Kode salah atau sudah kadaluarsa. Coba lagi.',
      );
    }
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 3: Verify file builds**

Run: `pnpm typecheck`
Expected: PASS. If error about `verifyOtp` `type`, confirm `'email'` is correct discriminant in installed `@supabase/supabase-js`.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/portal.ts
git commit -m "feat(portal): server actions for invite, revoke, OTP request + verify"
```

---

## Phase 4 — Middleware Role Gate

### Task 4: Extend `updateSession` for role-aware redirects

**Files:**
- Modify: `lib/supabase/middleware.ts`

- [ ] **Step 1: Rewrite middleware with role gate**

Replace contents of `lib/supabase/middleware.ts` with:

```ts
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
const ROLE_COOKIE_TTL_SECONDS = 300; // 5 min cache

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

  // Public unauthenticated paths
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

  // Authenticated — resolve role (cookie cache or DB)
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

  // Role-based redirects
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
    // admin / assistant / viewer
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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat(portal): role-aware middleware redirect + cookie cache"
```

---

## Phase 5 — Portal Route Group, Layout, Header

### Task 5: Portal layouts + PortalHeader

**Files:**
- Create: `app/(portal)/layout.tsx`
- Create: `app/(portal)/portal/layout.tsx`
- Create: `components/portal/portal-header.tsx`

- [ ] **Step 1: Create `app/(portal)/layout.tsx`**

```tsx
export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

(Theme + Toaster already provided by root `app/layout.tsx`.)

- [ ] **Step 2: Create `app/(portal)/portal/layout.tsx`**

```tsx
import { redirect } from 'next/navigation';

import { PortalHeader } from '@/components/portal/portal-header';
import { getServerSupabase } from '@/lib/supabase/server';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'client') redirect('/dashboard');

  const { data: client } = await supabase
    .from('clients')
    .select('full_name')
    .eq('client_user_id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <PortalHeader fullName={client?.full_name ?? profile?.full_name ?? user.email ?? 'Klien'} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
```

**Note:** `/portal/login` is inside the route group but does NOT use this layout because the login page is wrapped only by `app/(portal)/layout.tsx`. **Critical:** put `login/` at `app/(portal)/portal/login/` and the login `page.tsx` MUST opt out of the protected layout by being structured to render its own minimal wrapper. Alternative if Next.js routing nests it under `portal/layout.tsx`: short-circuit the redirect at the top of `PortalLayout` when `pathname === '/portal/login'` — but server components don't get `pathname`. **Recommended fix:** move login page to `app/(portal)/login/page.tsx` (route `/login` is admin's, conflict) — instead, put login OUTSIDE the protected layout by structuring as:

```
app/(portal)/
├── layout.tsx                  # root-portal (minimal)
├── portal/
│   ├── login/page.tsx          # NOT under portal/layout.tsx
│   └── (private)/
│       ├── layout.tsx          # auth gate here
│       ├── page.tsx
│       ├── proyek/[id]/page.tsx
│       ├── pembayaran/page.tsx
│       ├── profile/page.tsx
│       └── auth/callback/route.ts
```

Adjust the file structure accordingly: rename `app/(portal)/portal/layout.tsx` → `app/(portal)/portal/(private)/layout.tsx`. All authenticated pages move into `(private)/`.

- [ ] **Step 3: Restructure folders for login-outside-gate**

Final folder layout:
```
app/(portal)/
├── layout.tsx
└── portal/
    ├── login/
    │   └── page.tsx
    └── (private)/
        ├── layout.tsx           (the auth-gated layout)
        ├── page.tsx             (dashboard)
        ├── proyek/[id]/page.tsx
        ├── pembayaran/page.tsx
        ├── profile/page.tsx
        └── auth/callback/route.ts
```

Move the `PortalLayout` code from Step 2 into `app/(portal)/portal/(private)/layout.tsx`.

- [ ] **Step 4: Create `components/portal/portal-header.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export function PortalHeader({ fullName }: { fullName: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/auth/sign-out', { method: 'POST' });
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ backgroundColor: 'var(--bg-elevated)' }}
    >
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/portal" className="font-semibold">
          Bimbingo
        </Link>
        <nav className="hidden gap-4 text-sm sm:flex">
          <Link href="/portal" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/portal/pembayaran" className="hover:underline">
            Pembayaran
          </Link>
          <Link href="/portal/profile" className="hover:underline">
            Profil
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {fullName}
          </span>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Typecheck + smoke**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/\(portal\)/ components/portal/portal-header.tsx
git commit -m "feat(portal): route group layout + header with logout"
```

---

## Phase 6 — Login + Callback

### Task 6: `/portal/login` page (2-step email + OTP)

**Files:**
- Create: `app/(portal)/portal/login/page.tsx`

- [ ] **Step 1: Write the login page**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPortalOtp, verifyPortalOtp } from '@/lib/actions/portal';

export default function PortalLoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await requestPortalOtp({ email });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success('Kode dikirim ke email Anda.');
    setStage('otp');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await verifyPortalOtp({ email, token });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    router.push('/portal');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Masuk ke Portal Klien</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bimbingo — Pantau progres skripsi Anda.
          </p>
        </div>

        {stage === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nama@email.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Mengirim…' : 'Kirim Kode'}
            </Button>
          </form>
        )}

        {stage === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="token">Kode 6 digit</Label>
              <Input
                id="token"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                required
                autoComplete="one-time-code"
                placeholder="123456"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Periksa kotak masuk email <strong>{email}</strong>.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={busy || token.length !== 6}>
              {busy ? 'Memverifikasi…' : 'Masuk'}
            </Button>
            <button
              type="button"
              className="block w-full text-center text-xs text-muted-foreground hover:underline"
              onClick={() => {
                setStage('email');
                setToken('');
              }}
            >
              Ganti email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/\(portal\)/portal/login/page.tsx
git commit -m "feat(portal): /portal/login email + OTP form"
```

### Task 7: Auth callback (invite redirect handler)

**Files:**
- Create: `app/(portal)/portal/(private)/auth/callback/route.ts`

The Supabase invite email's CTA points to `${appUrl}/portal/auth/callback?code=...`. Exchange the code for a session and redirect into the portal.

- [ ] **Step 1: Create callback route**

```ts
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
      failUrl.searchParams.set('error', 'invite_expired');
      return NextResponse.redirect(failUrl);
    }
  }

  const home = url.clone();
  home.pathname = '/portal';
  home.search = '';
  return NextResponse.redirect(home);
}
```

**Note:** This route lives **outside `(private)/`** if `(private)/layout.tsx` runs an auth gate that redirects before the session exchange happens. Re-locate to `app/(portal)/portal/auth/callback/route.ts` (NOT under `(private)`). Adjust folder structure accordingly.

Final structure:
```
app/(portal)/portal/
├── login/page.tsx
├── auth/callback/route.ts        <- NOT under (private)
└── (private)/
    ├── layout.tsx
    ├── page.tsx
    ├── proyek/[id]/page.tsx
    ├── pembayaran/page.tsx
    └── profile/page.tsx
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add app/\(portal\)/portal/auth/
git commit -m "feat(portal): OTP/invite callback route"
```

---

## Phase 7 — Portal Pages

### Task 8: `/portal` dashboard ringkas

**Files:**
- Create: `app/(portal)/portal/(private)/page.tsx`
- Create: `components/portal/project-card.tsx`

- [ ] **Step 1: Write ProjectCard component**

`components/portal/project-card.tsx`:

```tsx
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah, formatTanggal } from '@/lib/format';

export type ProjectCardProps = {
  id: string;
  title: string;
  status: string;
  progressPercent: number;
  nextMilestoneTitle: string | null;
  nextMilestoneDue: string | null;
  totalPaid: number;
  totalValue: number;
};

export function ProjectCard(p: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-base">{p.title}</CardTitle>
        <Badge variant="outline">{p.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progres</span>
            <span>{p.progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded bg-muted">
            <div
              className="h-2 rounded bg-primary"
              style={{ width: `${p.progressPercent}%` }}
            />
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Tahap berikutnya: </span>
          {p.nextMilestoneTitle ? (
            <>
              <strong>{p.nextMilestoneTitle}</strong>
              {p.nextMilestoneDue && ` — ${formatTanggal(p.nextMilestoneDue)}`}
            </>
          ) : (
            <span>—</span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">Pembayaran: </span>
          <strong>{formatRupiah(p.totalPaid)}</strong>
          <span className="text-muted-foreground"> dari {formatRupiah(p.totalValue)}</span>
        </div>
        <Link
          href={`/portal/proyek/${p.id}`}
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          Lihat detail →
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Write dashboard page**

`app/(portal)/portal/(private)/page.tsx`:

```tsx
import { ProjectCard, type ProjectCardProps } from '@/components/portal/project-card';
import { EmptyState } from '@/components/shared/empty-state';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function fetchProjects(): Promise<ProjectCardProps[]> {
  const supabase = await getServerSupabase();

  // RLS filters projects to those belonging to the logged-in client.
  const { data: projects, error: e1 } = await supabase
    .from('projects')
    .select('id, title, status')
    .order('created_at', { ascending: false });
  if (e1 || !projects) return [];

  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const [{ data: progress }, { data: finance }, { data: nextMilestones }] = await Promise.all([
    supabase
      .from('project_progress_summary')
      .select('project_id, progress_percent')
      .in('project_id', projectIds),
    supabase
      .from('project_finance_summary')
      .select('project_id, total_paid, total_value')
      .in('project_id', projectIds),
    supabase
      .from('project_milestones')
      .select('project_id, title, due_date, status, sequence')
      .in('project_id', projectIds)
      .not('status', 'in', '(approved,done)')
      .order('sequence', { ascending: true }),
  ]);

  const progressBy = new Map((progress ?? []).map((r) => [r.project_id, r.progress_percent ?? 0]));
  const financeBy = new Map(
    (finance ?? []).map((r) => [r.project_id, { paid: r.total_paid ?? 0, value: r.total_value ?? 0 }]),
  );
  const nextBy = new Map<string, { title: string; due_date: string | null }>();
  for (const m of nextMilestones ?? []) {
    if (!nextBy.has(m.project_id)) {
      nextBy.set(m.project_id, { title: m.title, due_date: m.due_date });
    }
  }

  return projects.map((p) => {
    const fin = financeBy.get(p.id);
    const next = nextBy.get(p.id);
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      progressPercent: Number(progressBy.get(p.id) ?? 0),
      nextMilestoneTitle: next?.title ?? null,
      nextMilestoneDue: next?.due_date ?? null,
      totalPaid: Number(fin?.paid ?? 0),
      totalValue: Number(fin?.value ?? 0),
    };
  });
}

export default async function PortalDashboardPage() {
  const projects = await fetchProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pantau progres proyek skripsi Anda.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Belum ada proyek aktif"
          description="Hubungi pembimbing Anda untuk informasi lebih lanjut."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} {...p} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS. If `EmptyState` API mismatch, adapt props to existing component.

- [ ] **Step 4: Commit**

```bash
git add app/\(portal\)/portal/\(private\)/page.tsx components/portal/project-card.tsx
git commit -m "feat(portal): /portal dashboard with project cards"
```

### Task 9: `/portal/proyek/[id]` detail

**Files:**
- Create: `app/(portal)/portal/(private)/proyek/[id]/page.tsx`
- Create: `components/portal/milestone-list.tsx`

- [ ] **Step 1: Write MilestoneList component**

`components/portal/milestone-list.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { formatTanggal } from '@/lib/format';

type MilestoneStatus =
  | 'not-started'
  | 'in-progress'
  | 'submitted'
  | 'revisi'
  | 'approved'
  | 'done';

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  'not-started': 'Belum mulai',
  'in-progress': 'Dikerjakan',
  submitted: 'Diserahkan',
  revisi: 'Revisi',
  approved: 'Disetujui',
  done: 'Selesai',
};

const STATUS_VARIANT: Record<MilestoneStatus, 'default' | 'secondary' | 'outline'> = {
  'not-started': 'outline',
  'in-progress': 'secondary',
  submitted: 'secondary',
  revisi: 'outline',
  approved: 'default',
  done: 'default',
};

export type MilestoneRow = {
  id: string;
  title: string;
  sequence: number;
  due_date: string | null;
  status: MilestoneStatus;
};

export function MilestoneList({ milestones }: { milestones: MilestoneRow[] }) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Belum ada tahapan tercatat.</p>
    );
  }
  return (
    <ul className="divide-y rounded-md border">
      {milestones.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-medium">
              <span className="mr-2 text-muted-foreground">#{m.sequence}</span>
              {m.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {m.due_date ? `Target: ${formatTanggal(m.due_date)}` : 'Tanpa target tanggal'}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[m.status]}>{STATUS_LABEL[m.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Write project detail page**

`app/(portal)/portal/(private)/proyek/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  MilestoneList,
  type MilestoneRow,
} from '@/components/portal/milestone-list';
import { formatTanggal } from '@/lib/format';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, status, target_end_date')
    .eq('id', id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: milestones }, { data: progress }] = await Promise.all([
    supabase
      .from('project_milestones')
      .select('id, title, sequence, due_date, status')
      .eq('project_id', id)
      .order('sequence', { ascending: true }),
    supabase
      .from('project_progress_summary')
      .select('progress_percent')
      .eq('project_id', id)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Proyek</p>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Progres" value={`${Number(progress?.progress_percent ?? 0)}%`} />
        <Stat label="Status" value={<Badge variant="outline">{project.status}</Badge>} />
        <Stat
          label="Target selesai"
          value={project.target_end_date ? formatTanggal(project.target_end_date) : '—'}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Tahapan</h2>
        <MilestoneList milestones={(milestones ?? []) as MilestoneRow[]} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
```

**Schema reference:** `projects.target_end_date date` (confirmed against `supabase/migrations/20260520000001_init.sql` line 137).

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add app/\(portal\)/portal/\(private\)/proyek/ components/portal/milestone-list.tsx
git commit -m "feat(portal): proyek detail with milestone list"
```

### Task 10: `/portal/pembayaran`

**Files:**
- Create: `app/(portal)/portal/(private)/pembayaran/page.tsx`
- Create: `components/portal/payment-status-badge.tsx`

- [ ] **Step 1: Write PaymentStatusBadge**

```tsx
// components/portal/payment-status-badge.tsx
import { Badge } from '@/components/ui/badge';

export function PaymentStatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge variant="default">Terverifikasi</Badge>
  ) : (
    <Badge variant="outline">Menunggu verifikasi</Badge>
  );
}
```

- [ ] **Step 2: Write payments page**

```tsx
// app/(portal)/portal/(private)/pembayaran/page.tsx
import { PaymentStatusBadge } from '@/components/portal/payment-status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PortalPembayaranPage() {
  const supabase = await getServerSupabase();

  const [{ data: payments }, { data: finance }] = await Promise.all([
    supabase
      .from('payments')
      .select('id, amount, paid_at, method, installment_label, verified, project_id')
      .order('paid_at', { ascending: false }),
    supabase
      .from('project_finance_summary')
      .select('total_paid, total_value, outstanding'),
  ]);

  const totalPaid = (finance ?? []).reduce(
    (sum, r) => sum + Number(r.total_paid ?? 0),
    0,
  );
  const totalValue = (finance ?? []).reduce(
    (sum, r) => sum + Number(r.total_value ?? 0),
    0,
  );
  const outstanding = totalValue - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Daftar tagihan dan pembayaran yang sudah tercatat.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Total tagihan" value={formatRupiah(totalValue)} />
        <KPI label="Sudah dibayar" value={formatRupiah(totalPaid)} />
        <KPI
          label="Sisa"
          value={formatRupiah(outstanding)}
          tone={outstanding > 0 ? 'warning' : 'success'}
        />
      </div>

      {(payments ?? []).length === 0 ? (
        <EmptyState
          title="Belum ada pembayaran tercatat"
          description="Pembayaran yang Anda lakukan akan muncul di sini setelah dicatat admin."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Termin</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(payments ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatTanggal(p.paid_at)}</TableCell>
                <TableCell>{p.installment_label ?? '—'}</TableCell>
                <TableCell>{p.method}</TableCell>
                <TableCell className="text-right">{formatRupiah(Number(p.amount))}</TableCell>
                <TableCell>
                  <PaymentStatusBadge verified={p.verified} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function KPI({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'warning' | 'success';
}) {
  const color =
    tone === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'success'
        ? 'text-emerald-600 dark:text-emerald-400'
        : '';
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-base font-semibold ${color}`}>{value}</p>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add app/\(portal\)/portal/\(private\)/pembayaran/ components/portal/payment-status-badge.tsx
git commit -m "feat(portal): /portal/pembayaran with KPIs + table"
```

### Task 11: `/portal/profile`

**Files:**
- Create: `app/(portal)/portal/(private)/profile/page.tsx`

- [ ] **Step 1: Write profile page**

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PortalProfilePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from('clients')
    .select('full_name, email, whatsapp, university, faculty, major')
    .eq('client_user_id', user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Data ini dikelola admin. Hubungi pembimbing jika ada yang perlu diubah.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" value={client?.full_name ?? '—'} />
          <Field label="Email" value={client?.email ?? '—'} />
          <Field label="WhatsApp" value={client?.whatsapp ?? '—'} />
          <Field label="Kampus" value={client?.university ?? '—'} />
          <Field label="Fakultas" value={client?.faculty ?? '—'} />
          <Field label="Jurusan" value={client?.major ?? '—'} />
        </CardContent>
      </Card>

      <form action="/auth/sign-out" method="post">
        <Button type="submit" variant="outline">
          Keluar
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add app/\(portal\)/portal/\(private\)/profile/
git commit -m "feat(portal): /portal/profile read-only + logout"
```

---

## Phase 8 — Admin-Side Integration

### Task 12: Invite/Revoke buttons + "Akses Portal" section

**Files:**
- Create: `components/clients/invite-portal-button.tsx`
- Create: `components/clients/revoke-portal-button.tsx`
- Modify: `app/(app)/clients/[id]/page.tsx`

- [ ] **Step 1: Create InvitePortalButton**

```tsx
// components/clients/invite-portal-button.tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { inviteClientToPortal } from '@/lib/actions/portal';

export function InvitePortalButton({
  clientId,
  disabled = false,
  disabledReason,
}: {
  clientId: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [pending, start] = useTransition();

  async function handleClick() {
    start(async () => {
      const res = await inviteClientToPortal({ clientId });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success('Email invite berhasil dikirim ke klien.');
    });
  }

  if (disabled) {
    return (
      <Button disabled title={disabledReason} variant="outline">
        Aktifkan portal
      </Button>
    );
  }
  return (
    <Button onClick={handleClick} disabled={pending} variant="default">
      {pending ? 'Mengirim…' : 'Aktifkan portal'}
    </Button>
  );
}
```

- [ ] **Step 2: Create RevokePortalButton (with AlertDialog)**

```tsx
// components/clients/revoke-portal-button.tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { revokeClientPortalAccess } from '@/lib/actions/portal';

export function RevokePortalButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function handleConfirm() {
    start(async () => {
      const res = await revokeClientPortalAccess({ clientId });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success('Akses portal klien dicabut.');
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Cabut akses
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cabut akses portal?</AlertDialogTitle>
          <AlertDialogDescription>
            Klien tidak bisa login lagi ke portal. Tindakan ini dapat dilakukan
            ulang dengan invite baru kalau dibutuhkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? 'Mencabut…' : 'Ya, cabut'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 3: Add "Akses Portal" section to client detail page**

Open `app/(app)/clients/[id]/page.tsx` and append the following block inside the main content area (after existing detail sections). First read the file to find an appropriate insertion point — typically after the contact info card and before notes/projects.

Insert this section:

```tsx
import { InvitePortalButton } from '@/components/clients/invite-portal-button';
import { RevokePortalButton } from '@/components/clients/revoke-portal-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ...inside the JSX, ensure client query selects `client_user_id` and `email`:
//   .select('id, full_name, email, ..., client_user_id')

<Card>
  <CardHeader>
    <CardTitle>Akses Portal</CardTitle>
    <CardDescription>
      Klien dapat login di /portal/login dan melihat progres proyek sendiri.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    {!client.email ? (
      <p className="text-sm text-muted-foreground">
        Tambahkan email klien dulu sebelum mengaktifkan portal.
      </p>
    ) : client.client_user_id ? (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">Aktif</Badge>
          <span className="text-sm text-muted-foreground">
            Klien dapat login dengan email {client.email}.
          </span>
        </div>
        <RevokePortalButton clientId={client.id} />
      </div>
    ) : (
      <InvitePortalButton clientId={client.id} />
    )}
  </CardContent>
</Card>
```

Update the client query in the same file to include `client_user_id`:
```ts
.select('id, full_name, email, /* ...other fields... */, client_user_id')
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add components/clients/invite-portal-button.tsx components/clients/revoke-portal-button.tsx app/\(app\)/clients/\[id\]/page.tsx
git commit -m "feat(portal): admin Akses Portal section with invite + revoke"
```

---

## Phase 9 — RLS Smoke Test (Manual)

### Task 13: Write & run RLS test script

**Files:**
- Create: `tests/rls/portal.sql`

- [ ] **Step 1: Write the SQL test script**

Create `tests/rls/portal.sql`:

```sql
-- Manual RLS smoke test for Client Portal.
-- Run from Supabase SQL editor or psql against the same project as the app.
--
-- Pre-conditions (set up test data first via dashboard or SQL):
--   - Admin A (auth user :admin_a) owns Client X and Project_A (client_id=X)
--   - Admin B (auth user :admin_b) owns Client Y and Project_B (client_id=Y)
--   - Client X invited to portal -> auth user :client_x linked
--     (clients.client_user_id = :client_x for X)

-- TEST 1: as client_x, should see only Client X
set local role = 'authenticated';
set local "request.jwt.claim.sub" = ':client_x';

select count(*) as visible_clients from public.clients;
-- Expected: 1

select count(*) as visible_projects from public.projects;
-- Expected: 1 (Project_A only)

select count(*) as visible_milestones from public.project_milestones;
-- Expected: count of milestones under Project_A

select count(*) as visible_payments from public.payments;
-- Expected: count of payments under Project_A only

-- TEST 2: as client_x, must NOT see admin B's data
select count(*) as leaked_client_y
  from public.clients where full_name like '%Y%';
-- Expected: 0

select count(*) as leaked_project_b
  from public.projects where title like '%B%';
-- Expected: 0

-- TEST 3: as admin_a, existing owner_id policy still works
set local "request.jwt.claim.sub" = ':admin_a';
select count(*) as admin_a_clients from public.clients;
-- Expected: 1+ (all clients owned by admin A)

-- Reset
reset role;
reset "request.jwt.claim.sub";
```

- [ ] **Step 2: Document how to run**

Add a `README.md` note (or update existing) inside `tests/rls/`:

```
# RLS smoke tests

Manual SQL scripts. Run via Supabase SQL editor — substitute `:client_x`,
`:admin_a`, `:admin_b` with real UUIDs from `auth.users`.

Each `select count(*)` includes the expected value as a comment. Compare manually.
```

- [ ] **Step 3: Commit**

```bash
git add tests/rls/portal.sql tests/rls/README.md
git commit -m "test(portal): RLS smoke test SQL"
```

---

## Phase 10 — Email Template Config + Final Verification

### Task 14: Configure Supabase email templates

**Manual configuration — no file change.**

- [ ] **Step 1: Switch Magic Link template to OTP code**

In Supabase Dashboard:
1. Authentication → Email Templates → **Magic Link**.
2. Replace body markup. Replace `{{ .ConfirmationURL }}` with `{{ .Token }}`:

```
Kode masuk Bimbingo Anda:

{{ .Token }}

Kode ini berlaku 1 jam. Jangan bagikan ke siapapun.
```

3. Set subject: `Kode masuk Bimbingo: {{ .Token }}`.
4. Save.

- [ ] **Step 2: Customize Invite User template**

Authentication → Email Templates → **Invite User**:
1. Body include link to `{{ .ConfirmationURL }}` (keeps invite as a link — fine; magic-link prefetcher issue only affects login OTP, not first-time invite).
2. Set subject: `Anda diundang ke Portal Bimbingo`.
3. Body example:

```
Halo {{ .Data.full_name }},

Anda telah diundang untuk mengakses portal klien Bimbingo.

Klik link di bawah untuk mengaktifkan akun:

{{ .ConfirmationURL }}

Setelah aktif, login berikutnya cukup masukkan email Anda dan kode 6 digit yang dikirim ke email ini.
```

4. Save.

- [ ] **Step 3: Smoke test (manual end-to-end)**

Using a real alternate email (not the admin email):

1. Log in as admin → buka klien dengan email diisi → klik **Aktifkan portal**.
2. Buka email klien → klik link invite → arahkan ke `/portal/auth/callback` → redirect ke `/portal`.
3. Verifikasi dashboard tampil + cuma data klien tersebut yang muncul.
4. Logout via tombol di header → `/portal/login`.
5. Login ulang via email → terima 6-digit code → input → masuk portal.
6. Coba akses `http://localhost:3000/dashboard` → middleware redirect ke `/portal`.
7. Kembali ke admin → klien yang sama → **Cabut akses**. Tunggu ≤5 menit (cache cookie) atau hard refresh dari sisi klien → next request redirect ke `/portal/login`.

- [ ] **Step 4: Run RLS SQL script (Task 13)** dengan UUIDs nyata. Verifikasi semua count sesuai expected.

- [ ] **Step 5: Final commit (only if any doc updates needed)**

```bash
# If updating docs/08-deployment-devops.md with email template config:
git add docs/08-deployment-devops.md
git commit -m "docs(deployment): document portal email template config"
```

---

## Self-Review Notes

**Spec coverage check:** every section of `docs/superpowers/specs/2026-05-22-client-portal-design.md` maps to a task:

| Spec section | Task |
|---|---|
| §1 Scope | covered (no implementation needed) |
| §2 Decisions D1–D6 | enforced across Tasks 1, 3, 4, 5 |
| §3 Schema | Task 1 |
| §4 Auth flow (invite, login, callback, revoke) | Tasks 3, 6, 7, 12 |
| §5 Route structure + middleware | Tasks 4, 5 |
| §6 Pages content (dashboard, detail, payments, profile) | Tasks 8, 9, 10, 11 |
| §7 Admin integration | Task 12 |
| §8 Testing (unit + RLS smoke + manual E2E) | Tasks 2, 13, 14 |
| §9 Security checklist | enforced in Task 3 (`requireUser`, zod, generic errors) |
| §10 Deployment sequence | Task 14 |

**Out of plan (intentional, per spec §1):** file download draft bab, komentar klien, notifikasi WA/email, custom domain klien, multi-klien per proyek.

**Schema column references verified against `20260520000001_init.sql`:** `projects.target_end_date`, `clients.client_user_id` (new in Task 1), `payments.installment_label`/`verified`/`method`/`paid_at`/`amount`, `project_milestones.title`/`sequence`/`due_date`/`status`.

---

**Plan ready.** Save location: `docs/superpowers/plans/2026-05-22-client-portal.md`.
