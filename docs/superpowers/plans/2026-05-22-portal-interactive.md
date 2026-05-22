# Portal Interactive Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend client portal dari read-only → interaktif: komentar 2-arah per milestone, download draf bab via signed URL, in-app notification bell (polling 30s).

**Architecture:** Tabel baru `milestone_comments` + `notifications` + kolom `files.milestone_id`. RLS: client SELECT visible categories + INSERT own comments. Notifikasi insert manual via server-action helper `notifyUser()` (service-role karena recipient ≠ caller). UI: portal extends `/portal/proyek/[id]` dengan collapsible drawer per milestone; admin gets new `/projects/[id]/comments` subpage; bell mounted di kedua header.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres + Storage (signed URL), TypeScript strict, Tailwind v4, sonner toasts, Vitest.

**Spec reference:** `docs/superpowers/specs/2026-05-22-portal-interactive-design.md`.

---

## File Structure

### Files to create
- `supabase/migrations/20260523000001_portal_interactive.sql`
- `lib/schemas/portal-comments.ts`
- `lib/actions/portal-comments.ts`
- `lib/actions/portal-files.ts`
- `lib/actions/inbox.ts`
- `lib/actions/_notify.ts`
- `components/portal/milestone-detail-drawer.tsx` ('use client')
- `components/portal/comment-bubble.tsx`
- `components/portal/comment-thread.tsx` ('use client' wrapper around bubble list + box)
- `components/portal/post-comment-box.tsx` ('use client')
- `components/portal/file-list-row.tsx` ('use client')
- `components/portal/portal-notification-bell.tsx` ('use client')
- `components/shared/inbox-bell-tab.tsx` ('use client', second tab in admin bell)
- `app/(app)/projects/[id]/comments/page.tsx` (admin)
- `tests/schemas/portal-comments.test.ts`
- `tests/rls/portal-interactive.sql`

### Files to modify
- `types/database.ts` — regen
- `lib/actions/projects.ts` — add `setMilestoneStatus(id, status)` action + notif call
- `lib/actions/payments.ts` — extend `setPaymentVerified` to call notif
- `components/portal/portal-header.tsx` — mount `PortalNotificationBell`
- `components/shared/notification-bell.tsx` — add second tab "Aktivitas" reading from `notifications`
- `app/(portal)/portal/(private)/proyek/[id]/page.tsx` — render `<MilestoneDetailDrawer>` per milestone row (anchor `id="m-{id}"`)
- `app/(app)/projects/[id]/` — add tab nav including "Komentar Klien" link

---

## Phase 1 — Schema & Types

### Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/20260523000001_portal_interactive.sql`

- [ ] **Step 1: Write migration file with exact content**

```sql
-- 1. milestone_comments
create table public.milestone_comments (
  id              uuid primary key default gen_random_uuid(),
  milestone_id    uuid not null
                    references public.project_milestones(id) on delete cascade,
  author_id       uuid references auth.users(id) on delete set null,
  author_role     text not null check (author_role in ('admin','client')),
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);

create index idx_milestone_comments_milestone
  on public.milestone_comments(milestone_id, created_at);

alter table public.milestone_comments enable row level security;

create policy "admin manage milestone_comments via project"
  on public.milestone_comments
  for all to authenticated
  using (
    milestone_id in (
      select m.id from public.project_milestones m
      join public.projects p on p.id = m.project_id
      where p.owner_id = auth.uid()
    )
  )
  with check (
    milestone_id in (
      select m.id from public.project_milestones m
      join public.projects p on p.id = m.project_id
      where p.owner_id = auth.uid()
    )
  );

create policy "client reads own milestone_comments"
  on public.milestone_comments
  for select to authenticated
  using (
    milestone_id in (
      select m.id from public.project_milestones m
      join public.projects p on p.id = m.project_id
      join public.clients c on c.id = p.client_id
      where c.client_user_id = auth.uid()
    )
  );

create policy "client inserts own milestone_comments"
  on public.milestone_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and author_role = 'client'
    and milestone_id in (
      select m.id from public.project_milestones m
      join public.projects p on p.id = m.project_id
      join public.clients c on c.id = p.client_id
      where c.client_user_id = auth.uid()
    )
  );

-- 2. notifications (persistent inbox)
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in (
    'milestone_comment',
    'milestone_status',
    'payment_verified',
    'project_status',
    'invite_activated'
  )),
  payload         jsonb not null default '{}'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index idx_notifications_user_unread
  on public.notifications(user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "users read own notifications"
  on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy "users update own notifications (mark read)"
  on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. files RLS for client read of visible categories
create policy "client reads visible files of own projects"
  on public.files
  for select to authenticated
  using (
    category in ('draft','final','referensi')
    and project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.client_user_id = auth.uid()
    )
  );

-- 4. files.milestone_id FK
alter table public.files
  add column if not exists milestone_id uuid
    references public.project_milestones(id) on delete set null;
create index if not exists idx_files_milestone on public.files(milestone_id);
```

- [ ] **Step 2: Apply migration via MCP**

Tools available: `mcp__plugin_supabase_supabase__apply_migration`. Project ID: `cjdxmzruhewjfvlqqxmm`. Name: `portal_interactive`. Paste exact SQL above.

Expected: `{"success":true}`.

- [ ] **Step 3: Regenerate types**

Tools: `mcp__plugin_supabase_supabase__generate_typescript_types` for project `cjdxmzruhewjfvlqqxmm`. Write returned content to `types/database.ts` (read first then write).

- [ ] **Step 4: Verify schema via SQL**

```sql
select table_name, column_name from information_schema.columns
where table_schema='public' and table_name in ('milestone_comments','notifications')
order by table_name, ordinal_position;

select column_name from information_schema.columns
where table_schema='public' and table_name='files' and column_name='milestone_id';

select policyname from pg_policies
where schemaname='public'
and policyname in (
  'admin manage milestone_comments via project',
  'client reads own milestone_comments',
  'client inserts own milestone_comments',
  'users read own notifications',
  'users update own notifications (mark read)',
  'client reads visible files of own projects'
);
```

Expected: 6 policy rows + columns enumerated.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck
git add supabase/migrations/20260523000001_portal_interactive.sql types/database.ts
git commit -m "feat(portal): schema + RLS for comments, notifications, file visibility"
```

---

## Phase 2 — Zod Schemas

### Task 2: zod for comments

**Files:**
- Create: `lib/schemas/portal-comments.ts`
- Test: `tests/schemas/portal-comments.test.ts`

- [ ] **Step 1: Failing test**

`tests/schemas/portal-comments.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PostMilestoneCommentSchema } from '@/lib/schemas/portal-comments';

describe('PostMilestoneCommentSchema', () => {
  it('accepts valid uuid + body', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
      body: 'Hallo pak, mau tanya bab 3.',
    });
    expect(r.success).toBe(true);
  });
  it('rejects empty body', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
      body: '   ',
    });
    expect(r.success).toBe(false);
  });
  it('rejects body > 2000 char', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
      body: 'x'.repeat(2001),
    });
    expect(r.success).toBe(false);
  });
  it('rejects non-uuid milestoneId', () => {
    const r = PostMilestoneCommentSchema.safeParse({
      milestoneId: 'not-uuid',
      body: 'halo',
    });
    expect(r.success).toBe(false);
  });
});
```

Run: `pnpm test tests/schemas/portal-comments.test.ts`. FAIL: cannot find module.

- [ ] **Step 2: Implement schemas**

`lib/schemas/portal-comments.ts`:
```ts
import { z } from 'zod';

export const PostMilestoneCommentSchema = z.object({
  milestoneId: z.string().uuid('Milestone ID tidak valid'),
  body: z
    .string()
    .trim()
    .min(1, 'Komentar tidak boleh kosong')
    .max(2000, 'Maksimal 2000 karakter'),
});
export type PostMilestoneCommentInput = z.infer<typeof PostMilestoneCommentSchema>;

export type MilestoneCommentRow = {
  id: string;
  author_id: string | null;
  author_role: 'admin' | 'client';
  author_name: string;
  body: string;
  created_at: string;
};
```

- [ ] **Step 3: Run + commit**

```bash
pnpm test tests/schemas/portal-comments.test.ts
pnpm typecheck
git add lib/schemas/portal-comments.ts tests/schemas/portal-comments.test.ts
git commit -m "feat(portal): zod schemas for milestone comments"
```

Expected: 4 PASS.

---

## Phase 3 — Server Actions

### Task 3: Notification helper

**Files:**
- Create: `lib/actions/_notify.ts`

- [ ] **Step 1: Implement helper**

`lib/actions/_notify.ts`:
```ts
import 'server-only';
import { getAdminSupabase } from '@/lib/supabase/admin';

export type NotifType =
  | 'milestone_comment'
  | 'milestone_status'
  | 'payment_verified'
  | 'project_status'
  | 'invite_activated';

export async function notifyUser(
  userId: string,
  type: NotifType,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!userId) return;
  const admin = getAdminSupabase();
  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    payload,
  });
  if (error) console.error('[notify] insert failed', { type, userId, error });
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add lib/actions/_notify.ts
git commit -m "feat(portal): notifyUser helper (service-role)"
```

### Task 4: Inbox actions

**Files:**
- Create: `lib/actions/inbox.ts`

- [ ] **Step 1: Implement**

```ts
'use server';

import { revalidatePath } from 'next/cache';

import { fail, ok, requireUser, type ActionResult } from './_helper';
import { getServerSupabase } from '@/lib/supabase/server';
import type { NotifType } from './_notify';

export type NotifRow = {
  id: string;
  type: NotifType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export async function listMyNotifications(opts?: {
  limit?: number;
}): Promise<ActionResult<NotifRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, payload, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(opts?.limit ?? 20);
    if (error) throw error;
    return ok((data ?? []) as NotifRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function unreadNotificationCount(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);
    if (error) throw error;
    return ok({ count: count ?? 0 });
  } catch (e) {
    return fail(e);
  }
}

export async function markNotificationRead(
  id: string,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
    if (error) throw error;
    revalidatePath('/portal');
    revalidatePath('/dashboard');
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    if (error) throw error;
    revalidatePath('/portal');
    revalidatePath('/dashboard');
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add lib/actions/inbox.ts
git commit -m "feat(portal): inbox actions — list, unread count, mark read"
```

### Task 5: Portal-comments actions

**Files:**
- Create: `lib/actions/portal-comments.ts`

- [ ] **Step 1: Implement**

```ts
'use server';

import { revalidatePath } from 'next/cache';

import {
  ActionError, fail, ok, requireUser,
  type ActionResult,
} from './_helper';
import { getServerSupabase } from '@/lib/supabase/server';
import { notifyUser } from './_notify';
import {
  PostMilestoneCommentSchema,
  type MilestoneCommentRow,
} from '@/lib/schemas/portal-comments';

export async function postMilestoneComment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = PostMilestoneCommentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(
        'validation_error',
        'Komentar tidak valid',
        parsed.error.flatten().fieldErrors,
      );
    }
    const supabase = await getServerSupabase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const authorRole: 'admin' | 'client' =
      profile?.role === 'client' ? 'client' : 'admin';

    const { data: ins, error: e1 } = await supabase
      .from('milestone_comments')
      .insert({
        milestone_id: parsed.data.milestoneId,
        author_id: user.id,
        author_role: authorRole,
        body: parsed.data.body,
      })
      .select('id')
      .single();
    if (e1) throw e1;

    // Resolve counterpart + send notif
    const { data: ctx } = await supabase
      .from('project_milestones')
      .select('id, title, project_id, projects(owner_id, client_id, title, clients(client_user_id))')
      .eq('id', parsed.data.milestoneId)
      .maybeSingle();
    const project: any = (ctx as any)?.projects;
    const client: any = project?.clients;
    if (project && client) {
      const recipientId =
        authorRole === 'client' ? project.owner_id : client.client_user_id;
      if (recipientId && recipientId !== user.id) {
        await notifyUser(recipientId, 'milestone_comment', {
          milestone_id: parsed.data.milestoneId,
          milestone_title: (ctx as any).title,
          project_id: (ctx as any).project_id,
          project_title: project.title,
          comment_id: ins.id,
          by_role: authorRole,
        });
      }
    }

    revalidatePath(`/portal/proyek/${(ctx as any)?.project_id ?? ''}`);
    revalidatePath(`/projects/${(ctx as any)?.project_id ?? ''}/comments`);
    return ok({ id: ins.id });
  } catch (e) {
    return fail(e);
  }
}

export async function listMilestoneComments(
  milestoneId: string,
): Promise<ActionResult<MilestoneCommentRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('milestone_comments')
      .select('id, author_id, author_role, body, created_at')
      .eq('milestone_id', milestoneId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const ids = Array.from(
      new Set((data ?? []).map((r) => r.author_id).filter(Boolean)),
    ) as string[];
    const probe = ids.length ? ids : ['00000000-0000-0000-0000-000000000000'];
    const [{ data: profiles }, { data: clients }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', probe),
      supabase
        .from('clients')
        .select('client_user_id, full_name, nickname')
        .in('client_user_id', probe),
    ]);
    const nameBy = new Map<string, string>();
    for (const p of profiles ?? []) nameBy.set(p.id, p.full_name);
    for (const c of clients ?? []) {
      if (c.client_user_id)
        nameBy.set(c.client_user_id, c.nickname ?? c.full_name);
    }

    return ok(
      (data ?? []).map((r) => ({
        ...r,
        author_name: r.author_id
          ? (nameBy.get(r.author_id) ?? 'Pengguna')
          : 'Pengguna',
      })) as MilestoneCommentRow[],
    );
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add lib/actions/portal-comments.ts
git commit -m "feat(portal): postMilestoneComment + listMilestoneComments actions"
```

### Task 6: Portal-files actions

**Files:**
- Create: `lib/actions/portal-files.ts`

- [ ] **Step 1: Implement**

```ts
'use server';

import {
  ActionError, fail, ok, requireUser,
  type ActionResult,
} from './_helper';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getServerSupabase } from '@/lib/supabase/server';

export type PortalFileRow = {
  id: string;
  filename: string;
  category: string | null;
  size_bytes: number | null;
  uploaded_at: string;
  milestone_id: string | null;
};

const VISIBLE_CATEGORIES = ['draft', 'final', 'referensi'] as const;

export async function listMilestoneFiles(
  milestoneId: string,
): Promise<ActionResult<PortalFileRow[]>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('files')
      .select('id, filename, category, size_bytes, uploaded_at, milestone_id')
      .eq('milestone_id', milestoneId)
      .in('category', VISIBLE_CATEGORIES as unknown as string[])
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return ok((data ?? []) as PortalFileRow[]);
  } catch (e) {
    return fail(e);
  }
}

export async function getSignedFileUrl(
  fileId: string,
): Promise<ActionResult<{ url: string; filename: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data: f, error: e1 } = await supabase
      .from('files')
      .select('id, bucket, path, filename, category')
      .eq('id', fileId)
      .maybeSingle();
    if (e1) throw e1;
    if (!f) throw new ActionError('not_found', 'File tidak ditemukan.');

    const admin = getAdminSupabase();
    const { data: signed, error: e2 } = await admin.storage
      .from(f.bucket)
      .createSignedUrl(f.path, 300);
    if (e2 || !signed)
      throw e2 ?? new ActionError('internal', 'Gagal membuat link.');

    return ok({ url: signed.signedUrl, filename: f.filename });
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add lib/actions/portal-files.ts
git commit -m "feat(portal): listMilestoneFiles + getSignedFileUrl actions"
```

### Task 7: Extend `setPaymentVerified` to notify client

**Files:**
- Modify: `lib/actions/payments.ts:246-266`

- [ ] **Step 1: Edit `setPaymentVerified`**

Replace the body of `setPaymentVerified` (line 246–266) to also notify the linked client. Read the file first, then Edit:

```ts
export async function setPaymentVerified(
  id: string,
  verified: boolean,
): Promise<ActionResult<PaymentRow>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('payments')
      .update({ verified })
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) throw error;

    if (verified) {
      const { data: ctx } = await supabase
        .from('projects')
        .select('id, title, clients(client_user_id)')
        .eq('id', data.project_id)
        .maybeSingle();
      const client: any = (ctx as any)?.clients;
      if (client?.client_user_id) {
        const { notifyUser } = await import('./_notify');
        await notifyUser(client.client_user_id, 'payment_verified', {
          payment_id: id,
          amount: data.amount,
          project_id: data.project_id,
          project_title: (ctx as any).title,
        });
      }
    }

    revalidatePath('/finance');
    revalidatePath(`/projects/${data.project_id}/finance`);
    return ok(data as PaymentRow);
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add lib/actions/payments.ts
git commit -m "feat(portal): notify client when payment is verified"
```

### Task 8: Add `setMilestoneStatus` action + notify

**Files:**
- Modify: `lib/actions/projects.ts` (append new export)

- [ ] **Step 1: Append at end of file (before final closing — or after `attachLecturer`)**

Read file location of `attachLecturer` (around line 693+), insert NEW export after it OR at file end:

```ts
export async function setMilestoneStatus(
  milestoneId: string,
  status: 'not-started' | 'in-progress' | 'submitted' | 'revisi' | 'approved' | 'done',
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('project_milestones')
      .update({ status })
      .eq('id', milestoneId)
      .select('id, title, project_id, projects(title, clients(client_user_id))')
      .single();
    if (error) throw error;

    const project: any = (data as any).projects;
    const client: any = project?.clients;
    if (client?.client_user_id) {
      const { notifyUser } = await import('./_notify');
      await notifyUser(client.client_user_id, 'milestone_status', {
        milestone_id: data.id,
        milestone_title: data.title,
        project_id: data.project_id,
        project_title: project.title,
        new_status: status,
      });
    }

    revalidatePath(`/projects/${data.project_id}`);
    revalidatePath(`/portal/proyek/${data.project_id}`);
    return ok({ id: data.id });
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add lib/actions/projects.ts
git commit -m "feat(portal): setMilestoneStatus action + client notif"
```

---

## Phase 4 — Portal UI

### Task 9: Comment bubble + thread + post box

**Files:**
- Create: `components/portal/comment-bubble.tsx`
- Create: `components/portal/post-comment-box.tsx`
- Create: `components/portal/comment-thread.tsx`
- Create: `components/portal/file-list-row.tsx`

- [ ] **Step 1: `components/portal/comment-bubble.tsx`**

```tsx
import { formatTanggal } from '@/lib/format';
import type { MilestoneCommentRow } from '@/lib/schemas/portal-comments';

export function CommentBubble({
  comment,
  isMine,
}: {
  comment: MilestoneCommentRow;
  isMine: boolean;
}) {
  return (
    <div className={isMine ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className="max-w-[85%] rounded-lg border px-3 py-2 text-sm"
        style={{
          backgroundColor: isMine ? 'var(--brand-soft)' : 'var(--bg-elevated)',
          borderColor: isMine ? 'transparent' : 'var(--border)',
          color: isMine ? 'var(--brand-ink)' : 'var(--text-primary)',
        }}
      >
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
          <span className="font-semibold">{comment.author_name}</span>
          <span className="text-[var(--text-muted)]">
            · {comment.author_role === 'admin' ? 'Pembimbing' : 'Klien'}
          </span>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{comment.body}</p>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          {formatTanggal(comment.created_at)}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `components/portal/post-comment-box.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { postMilestoneComment } from '@/lib/actions/portal-comments';

export function PostCommentBox({
  milestoneId,
  onPosted,
}: {
  milestoneId: string;
  onPosted: () => void;
}) {
  const [body, setBody] = useState('');
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    start(async () => {
      const res = await postMilestoneComment({ milestoneId, body: trimmed });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      setBody('');
      onPosted();
    });
  }

  const remaining = 2000 - body.length;
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Tulis komentar atau pertanyaan…"
        className="w-full resize-y rounded-md border px-3 py-2 text-sm"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border)',
        }}
      />
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{remaining} karakter tersisa</span>
        <Button
          type="submit"
          size="sm"
          disabled={pending || body.trim().length === 0}
        >
          {pending ? 'Mengirim…' : 'Kirim komentar'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: `components/portal/comment-thread.tsx`**

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';

import { CommentBubble } from './comment-bubble';
import { PostCommentBox } from './post-comment-box';
import { listMilestoneComments } from '@/lib/actions/portal-comments';
import type { MilestoneCommentRow } from '@/lib/schemas/portal-comments';

export function CommentThread({
  milestoneId,
  currentUserId,
}: {
  milestoneId: string;
  currentUserId: string;
}) {
  const [comments, setComments] = useState<MilestoneCommentRow[] | null>(null);
  const [, start] = useTransition();

  function reload() {
    start(async () => {
      const res = await listMilestoneComments(milestoneId);
      if (res.ok) setComments(res.data);
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneId]);

  return (
    <div className="space-y-3">
      {comments === null ? (
        <p className="text-xs text-[var(--text-muted)]">Memuat diskusi…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          Belum ada komentar. Mulai pertanyaan dengan kotak di bawah.
        </p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <CommentBubble
              key={c.id}
              comment={c}
              isMine={c.author_id === currentUserId}
            />
          ))}
        </div>
      )}
      <PostCommentBox milestoneId={milestoneId} onPosted={reload} />
    </div>
  );
}
```

- [ ] **Step 4: `components/portal/file-list-row.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getSignedFileUrl } from '@/lib/actions/portal-files';
import { formatTanggal } from '@/lib/format';

export function FileListRow({
  id,
  filename,
  sizeBytes,
  uploadedAt,
}: {
  id: string;
  filename: string;
  sizeBytes: number | null;
  uploadedAt: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    const res = await getSignedFileUrl(id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    window.open(res.data.url, '_blank');
  }

  const sizeKb = sizeBytes ? Math.round(sizeBytes / 1024) : null;

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md border bg-[var(--bg-elevated)] p-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {filename}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {sizeKb ? `${sizeKb} KB · ` : ''}diunggah {formatTanggal(uploadedAt)}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleDownload}
        disabled={busy}
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? 'Memproses…' : 'Unduh'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck
git add components/portal/comment-bubble.tsx components/portal/post-comment-box.tsx components/portal/comment-thread.tsx components/portal/file-list-row.tsx
git commit -m "feat(portal): comment bubble + thread + post box + file list row"
```

### Task 10: Milestone detail drawer + integrate into `/portal/proyek/[id]`

**Files:**
- Create: `components/portal/milestone-detail-drawer.tsx`
- Modify: `app/(portal)/portal/(private)/proyek/[id]/page.tsx`

- [ ] **Step 1: Create drawer component**

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';

import { CommentThread } from './comment-thread';
import { FileListRow } from './file-list-row';
import { listMilestoneFiles, type PortalFileRow } from '@/lib/actions/portal-files';

export function MilestoneDetailDrawer({
  milestoneId,
  currentUserId,
}: {
  milestoneId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PortalFileRow[] | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    if (!open || files !== null) return;
    start(async () => {
      const res = await listMilestoneFiles(milestoneId);
      if (res.ok) setFiles(res.data);
      else setFiles([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
        {open ? 'Tutup detail' : 'Lihat diskusi & draf'}
      </button>

      {open ? (
        <div
          className="mt-3 space-y-4 rounded-lg border bg-[var(--bg-elevated)] p-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Draf bab
            </p>
            {files === null ? (
              <p className="text-xs text-[var(--text-muted)]">Memuat file…</p>
            ) : files.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                Belum ada draf bab untuk milestone ini.
              </p>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <FileListRow
                    key={f.id}
                    id={f.id}
                    filename={f.filename}
                    sizeBytes={f.size_bytes}
                    uploadedAt={f.uploaded_at}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Diskusi
            </p>
            <CommentThread
              milestoneId={milestoneId}
              currentUserId={currentUserId}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Modify portal milestone-list to render drawer**

Read `components/portal/milestone-list.tsx`. Inside the `<li>` of each milestone, after the badge row, mount `<MilestoneDetailDrawer milestoneId={m.id} currentUserId={...} />`.

Need to thread `currentUserId` from page → MilestoneList prop:

In `app/(portal)/portal/(private)/proyek/[id]/page.tsx`, fetch user id then pass `currentUserId` to `<MilestoneList milestones={...} currentUserId={user.id} />`.

Modify `MilestoneList` props:
```tsx
export function MilestoneList({
  milestones,
  currentUserId,
}: {
  milestones: MilestoneRow[];
  currentUserId: string;
}) { ... }
```

Inside the row card div, add at the bottom (above closing div):
```tsx
<MilestoneDetailDrawer milestoneId={m.id} currentUserId={currentUserId} />
```

Add anchor id to milestone row li:
```tsx
<li id={`m-${m.id}`} ...>
```

For passing currentUserId in page.tsx, fetch user before render:
```tsx
const {
  data: { user },
} = await supabase.auth.getUser();
const currentUserId = user?.id ?? '';
// ...
<MilestoneList milestones={(milestones ?? []) as MilestoneRow[]} currentUserId={currentUserId} />
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add components/portal/milestone-detail-drawer.tsx components/portal/milestone-list.tsx app/\(portal\)/portal/\(private\)/proyek/\[id\]/page.tsx
git commit -m "feat(portal): per-milestone drawer with files + comment thread"
```

### Task 11: Portal notification bell

**Files:**
- Create: `components/portal/portal-notification-bell.tsx`
- Modify: `components/portal/portal-header.tsx`

- [ ] **Step 1: Create bell component**

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  type NotifRow,
} from '@/lib/actions/inbox';
import { formatRupiah, formatTanggal } from '@/lib/format';

function notifText(n: NotifRow): {
  title: string;
  description: string;
  href: string;
} {
  const p = n.payload as any;
  switch (n.type) {
    case 'milestone_comment':
      return {
        title: `Balasan baru di ${p.milestone_title ?? 'milestone'}`,
        description: p.by_role === 'admin' ? 'Pembimbing mengirim komentar.' : 'Klien mengirim komentar.',
        href: `/portal/proyek/${p.project_id}#m-${p.milestone_id}`,
      };
    case 'milestone_status':
      return {
        title: `${p.milestone_title}: ${p.new_status}`,
        description: p.project_title ?? '',
        href: `/portal/proyek/${p.project_id}#m-${p.milestone_id}`,
      };
    case 'payment_verified':
      return {
        title: 'Pembayaran terverifikasi',
        description: `${formatRupiah(Number(p.amount ?? 0))} · ${p.project_title ?? ''}`,
        href: '/portal/pembayaran',
      };
    case 'project_status':
      return {
        title: `Status proyek: ${p.new_status ?? ''}`,
        description: p.project_title ?? '',
        href: `/portal/proyek/${p.project_id}`,
      };
    case 'invite_activated':
      return {
        title: 'Akun portal aktif',
        description: 'Selamat datang!',
        href: '/portal',
      };
  }
}

export function PortalNotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotifRow[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await unreadNotificationCount();
      if (!cancelled && res.ok) setCount(res.data.count);
    }
    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    start(async () => {
      const res = await listMyNotifications({ limit: 10 });
      if (res.ok) setItems(res.data);
    });
  }, [open]);

  function handleClickItem(n: NotifRow) {
    const { href } = notifText(n);
    start(async () => {
      await markNotificationRead(n.id);
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      );
      setCount((c) => Math.max(0, c - 1));
      setOpen(false);
      router.push(href);
    });
  }

  function handleMarkAll() {
    start(async () => {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((x) => ({ ...x, read_at: new Date().toISOString() })),
      );
      setCount(0);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md border bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
          {count > 0 ? (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div
          className="flex items-center justify-between border-b px-3 py-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-sm font-semibold">Notifikasi</span>
          {count > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleMarkAll}>
              Tandai semua
            </Button>
          ) : null}
        </div>
        <ul className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <li className="p-4 text-center text-xs text-[var(--text-muted)]">
              Belum ada notifikasi.
            </li>
          ) : (
            items.map((n) => {
              const t = notifText(n);
              const unread = !n.read_at;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClickItem(n)}
                    className="block w-full border-b px-3 py-2 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-start gap-2">
                      {unread ? (
                        <span
                          aria-hidden
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]"
                        />
                      ) : (
                        <span className="w-1.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {t.title}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {t.description}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          {formatTanggal(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Mount in `components/portal/portal-header.tsx`**

Read the file, then insert `<PortalNotificationBell />` inside the right-hand div (with avatar + theme toggle + Keluar). Add import.

```tsx
import { PortalNotificationBell } from './portal-notification-bell';
// ...
// Inside the right-side div, before <ThemeToggle />:
<PortalNotificationBell />
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add components/portal/portal-notification-bell.tsx components/portal/portal-header.tsx
git commit -m "feat(portal): notification bell in portal header (polling 30s)"
```

---

## Phase 5 — Admin UI

### Task 12: Admin tab "Komentar Klien"

**Files:**
- Create: `app/(app)/projects/[id]/comments/page.tsx`

- [ ] **Step 1: Implement page**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { CommentThread } from '@/components/portal/comment-thread';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProjectCommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', id)
    .maybeSingle();
  if (!project) notFound();

  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('id, title, sequence, status')
    .eq('project_id', id)
    .order('sequence', { ascending: true });

  return (
    <div className="space-y-6">
      <Link
        href={`/projects/${id}`}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke proyek
      </Link>

      <PageHeader
        kicker={`Proyek · ${project.title}`}
        title="Komentar klien"
        description="Balas pertanyaan klien per milestone. Klien hanya bisa post komentar — admin yang ubah status milestone."
      />

      {(milestones ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--text-muted)]">
            Proyek ini belum punya milestone. Tambahkan dulu di halaman Overview.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(milestones ?? []).map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <MessageSquare className="h-4 w-4 text-[var(--brand-ink)]" />
                  <span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      #{m.sequence.toString().padStart(2, '0')}
                    </span>{' '}
                    {m.title}
                  </span>
                  <Badge>{m.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentThread milestoneId={m.id} currentUserId={user.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add app/\(app\)/projects/\[id\]/comments/page.tsx
git commit -m "feat(admin): /projects/[id]/comments — admin reply per milestone"
```

### Task 13: Admin bell — add "Aktivitas" tab from `notifications`

**Files:**
- Modify: `components/shared/notification-bell.tsx`

- [ ] **Step 1: Read current file**

`components/shared/notification-bell.tsx` is the urgent-reminders bell (derived). We add a second tab inside the popover.

- [ ] **Step 2: Add second tab rendering recent persistent notifications**

Inside the Popover content, wrap existing urgent list in `<Tabs>` with two tabs: "Urgent" (existing) + "Aktivitas". The Aktivitas tab fetches via `listMyNotifications({ limit: 10 })` on tab activation and renders same as portal bell.

Since shadcn Tabs component may not exist in `components/ui/`, check first. If not, use simple state-based toggle:

```tsx
const [tab, setTab] = useState<'urgent' | 'aktivitas'>('urgent');

// At top of popover content:
<div className="flex border-b" style={{ borderColor: 'var(--border-subtle)' }}>
  <button
    type="button"
    className={`flex-1 px-3 py-2 text-xs font-medium ${tab === 'urgent' ? 'border-b-2 border-[var(--brand)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
    onClick={() => setTab('urgent')}
  >
    Urgent
  </button>
  <button
    type="button"
    className={`flex-1 px-3 py-2 text-xs font-medium ${tab === 'aktivitas' ? 'border-b-2 border-[var(--brand)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
    onClick={() => setTab('aktivitas')}
  >
    Aktivitas
  </button>
</div>

{tab === 'urgent' ? (
  /* existing urgent list */
) : (
  <ActivityTab />
)}
```

`<ActivityTab />` is a small client component that uses `listMyNotifications` and `markNotificationRead` (same logic as `PortalNotificationBell`). Extract shared logic into a helper component `<NotificationList items={...} onClick={...} />` if both use same render.

For now, copy the rendering pattern from `PortalNotificationBell` items list into the ActivityTab inline.

Skip implementation if existing bell is too complex to edit safely — just leave admin with the existing urgent bell + a TODO comment in the code. (Document this in plan §12 Open questions.)

**Pragmatic alternative for MVP:** mount `<InboxBell />` (a copy of PortalNotificationBell renamed) next to existing `<NotificationBell />` in `components/shared/topbar.tsx`. Two bell icons side by side. Less ideal aesthetically but ships faster.

For this task, take the pragmatic alternative:

```tsx
// components/shared/inbox-bell.tsx — copy of portal-notification-bell.tsx
// (same code, can later refactor to shared component)
```

Then modify `components/shared/topbar.tsx`:
```tsx
import { InboxBell } from './inbox-bell';
// In the topbar render:
<InboxBell />
<NotificationBell />
```

- [ ] **Step 3: Create `components/shared/inbox-bell.tsx`**

Copy entire content of `components/portal/portal-notification-bell.tsx` and rename component to `InboxBell`. Adjust `href` routes to admin:
```ts
case 'milestone_comment':
  return {
    ...,
    href: `/projects/${p.project_id}/comments`,
  };
case 'milestone_status':
  return {
    ...,
    href: `/projects/${p.project_id}`,
  };
case 'payment_verified':
  return {
    ...,
    href: `/projects/${p.project_id}/finance`,
  };
```

- [ ] **Step 4: Mount in `components/shared/topbar.tsx`**

Insert `<InboxBell />` before existing `<NotificationBell />`.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck
git add components/shared/inbox-bell.tsx components/shared/topbar.tsx
git commit -m "feat(admin): InboxBell in topbar — persistent notifications"
```

---

## Phase 6 — Tests

### Task 14: RLS smoke test SQL

**Files:**
- Create: `tests/rls/portal-interactive.sql`

- [ ] **Step 1: Write SQL**

```sql
-- Manual RLS smoke test for portal-interactive features.
-- Substitute :admin_a, :admin_b, :client_x with real UUIDs from auth.users.

-- TEST 1: client_x inserts milestone_comment with author_role='client' on own milestone — should succeed
set local role = 'authenticated';
set local "request.jwt.claim.sub" = ':client_x';
-- Replace <milestone_id> with one from client_x's project
insert into public.milestone_comments(milestone_id, author_id, author_role, body)
  values ('<milestone_id>', ':client_x'::uuid, 'client', 'Test komentar klien');
-- Expected: 1 row inserted

-- TEST 2: client_x inserts with author_role='admin' — should be rejected
insert into public.milestone_comments(milestone_id, author_id, author_role, body)
  values ('<milestone_id>', ':client_x'::uuid, 'admin', 'Mencoba pura-pura admin');
-- Expected: ERROR: new row violates row-level security policy

-- TEST 3: client_x reads only own project's milestones — should see only their data
select count(*) as visible_comments from public.milestone_comments;
-- Expected: N (>= 1 from test 1)

-- TEST 4: client_x cannot select notifications belonging to admin_a
set local "request.jwt.claim.sub" = ':admin_a';
select count(*) as admin_a_notifs from public.notifications;
-- Note the count.

set local "request.jwt.claim.sub" = ':client_x';
select count(*) as client_visible_admin_notifs from public.notifications
  where user_id = ':admin_a'::uuid;
-- Expected: 0

-- TEST 5: client_x reads visible files (draft/final/referensi) of own projects only
select count(*) as visible_files from public.files;
-- Expected: count of draft/final/referensi files in client_x's projects

-- TEST 6: client_x does NOT see internal/bukti-bayar files
select count(*) as leaked_internal from public.files
  where category in ('bukti-bayar','administrasi','lainnya');
-- Expected: 0

reset role;
reset "request.jwt.claim.sub";
```

- [ ] **Step 2: Commit**

```bash
git add tests/rls/portal-interactive.sql
git commit -m "test(portal): RLS smoke for interactive lite features"
```

### Task 15: Manual E2E checklist + docs

**Files:**
- Modify: `docs/08-deployment-devops.md` (append §10.8)

- [ ] **Step 1: Append section**

```markdown
### 10.8 Smoke test — portal interaktif

1. Admin login → /projects/[id] → klik tab "Komentar Klien".
2. Admin upload file: ke files dengan kategori `draft` + pilih milestone bab.
3. Klien login → /portal/proyek/[id] → expand milestone yang sama → file muncul → klik Unduh → file download (signed URL 5 menit).
4. Klien ketik komentar di textarea → submit → bubble muncul kanan (brand-soft).
5. Admin balas dari /projects/[id]/comments → bubble baru muncul kiri (elevated).
6. Klien refresh → balasan terlihat. Bell badge unread count >0.
7. Klien klik bell → list 10 terbaru → klik notif → mark-read + navigate ke milestone.
8. Admin bell juga ada InboxBell di topbar — fungsi sama.
9. Admin verify payment → klien dapat notif "Pembayaran terverifikasi".
10. Admin set milestone status approve via setMilestoneStatus action (manual via /projects/[id] UI) → klien dapat notif "Status milestone berubah".
```

- [ ] **Step 2: Commit**

```bash
git add docs/08-deployment-devops.md
git commit -m "docs(deployment): smoke test for portal interactive lite"
```

---

## Phase 7 — Final review + merge

### Task 16: Final review + merge ke main

- [ ] **Step 1: Run full quality gates**

```bash
pnpm typecheck   # must pass
pnpm lint        # must pass
pnpm test        # all unit tests must pass
pnpm build       # production build must succeed
```

- [ ] **Step 2: Dispatch final code reviewer subagent** (controller responsibility per superpowers:subagent-driven-development).

- [ ] **Step 3: Fix issues, then merge feature branch → main via `git merge --no-ff feat/portal-interactive`.**

```bash
git checkout main
git merge --no-ff feat/portal-interactive -m "Merge feat/portal-interactive — comments + files + notifications"
git push origin main
git branch -d feat/portal-interactive
```

---

## Self-Review Notes

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1 Scope | covered by all tasks |
| §2 D1–D10 | enforced across schema, actions, UI |
| §3 Schema | Task 1 |
| §4 Server actions | Tasks 3–8 |
| §5 zod schemas | Task 2 |
| §6 Portal UI | Tasks 9–11 |
| §7 Admin UI | Tasks 12–13 |
| §8 Storage flow | covered in Task 6 + manual flow §10.8 |
| §9 Testing | Tasks 2, 14, 15 |
| §10 Security | enforced in Tasks 3, 5, 6 |
| §11 Deployment | Task 1 Step 2 + Task 16 |
| §12 Open questions | noted at Task 13 step 2 |

**Schema references verified against `20260520000001_init.sql`:**
- `files.category` enum literals `'draft','referensi','bukti-bayar','administrasi','final','lainnya'` (line 207) — visible categories chosen: `draft`, `final`, `referensi` (typo `'reference'` corrected to `'referensi'` in spec + plan).
- `payments.project_id`, `payments.amount`, `payments.verified` — used in Task 7.
- `project_milestones.title`, `.status`, `.project_id` — used in Tasks 5, 8.
- `projects.client_id`, `.owner_id`, `.title` — used in Task 5, 8.
- `clients.client_user_id` (added in migration `20260522000001_client_portal`).

**Out of plan (intentional, per spec §1):**
- File upload from client.
- Edit/delete comments.
- Email/WA notifications (Fonnte).
- Realtime live updates.
- Comment reactions/mentions/markdown.

**Branch strategy**: per [[feedback-branch-strategy]] memory — work on `feat/portal-interactive` lokal, merge `--no-ff` ke main, push sekali = 1 deploy Vercel.

---

**Plan ready.** Save location: `docs/superpowers/plans/2026-05-22-portal-interactive.md`.
