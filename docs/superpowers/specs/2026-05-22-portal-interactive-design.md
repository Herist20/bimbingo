# Portal Interaktif Lite — Design Spec

**Status:** Draft — pending implementation
**Tanggal:** 2026-05-22
**Owner:** nosuke1@gmail.com
**Roadmap ref:** ekstensi `docs/superpowers/specs/2026-05-22-client-portal-design.md` (F2.4 dasar) ke fase berikutnya per `docs/09-monetization-scalability.md` skenario B.

---

## 1. Tujuan & Lingkup

Ekstensi portal klien dari **read-only lite** ke **interaktif lite**. Klien tidak lagi sekadar memantau — sekarang bisa:

- Lihat **draf bab** yang sudah diunggah pembimbing (download via signed URL).
- Kirim & baca **komentar 2-arah** per milestone bab (pertanyaan, revisi, klarifikasi).
- Dapat **notifikasi in-app** saat ada balasan, perubahan status milestone, atau pembayaran terverifikasi.

Admin di sisi lain dapat membalas komentar klien dari halaman proyek + lihat notifikasi sendiri kalau klien post sesuatu.

**Eksplisit out-of-scope (fase 3+):**
- Realtime live update (pakai polling 30 detik).
- Email/WhatsApp notifikasi (Fonnte ditunda).
- File upload dari klien.
- Edit/delete/reaction comments (append-only).
- Mention/search/markdown/attachment dalam comments.

**Estimasi effort:** ~3–4 hari kerja efektif.

---

## 2. Keputusan Arsitektur (decisions made)

| # | Keputusan | Alasan |
|---|-----------|--------|
| D1 | **Tabel baru `milestone_comments`**, bukan extend `task_comments`. | Pisahkan concern (client-facing vs admin internal). FK ke `project_milestones` langsung. RLS terisolasi. |
| D2 | **Comments append-only**. Tidak ada update/delete row. Salah ketik → comment baru. | YAGNI + audit-friendly + simpler RLS. |
| D3 | **File visibility via kolom `files.category`** yang sudah ada. Kategori `draft`/`final`/`referensi` visible ke klien; `bukti-bayar`/`administrasi`/`lainnya`/null tidak. | Pakai column existing, zero schema migration untuk visibility. Categories per `init.sql:207`: `'draft','referensi','bukti-bayar','administrasi','final','lainnya'`. |
| D4 | **Signed URL via server action**, bukan storage policy. Server action pakai admin client untuk generate URL setelah validasi RLS pada files row. | Tight scope. Tidak bergantung pada path-parsing storage policy. URL 5-menit TTL. |
| D5 | **Tabel baru `notifications`** dengan kolom JSONB `payload`. Mark-read via `read_at` timestamp. | Schema-less payload mudah extend. Index unread partial untuk query cepat. |
| D6 | **Polling 30 detik** untuk unread count, bukan Supabase Realtime. | Hemat free-tier realtime quota. UX acceptable untuk volume rendah (5–20 klien). Future: bisa migrasi ke realtime kalau butuh. |
| D7 | **Insert notifikasi dari server action manual** (bukan DB trigger). Helper `notifyUser()` dipanggil dari action yang mengubah state. | Explicit, mudah debug, mudah turn-off per event. |
| D8 | **Tabel `notifications` terpisah dari existing `lib/actions/notifications.ts`** yang sebenarnya menghitung "urgent reminders" derived dari deadline/staleness. File baru `lib/actions/inbox.ts` untuk persistent notifications. | Jangan campur derived vs persistent. Existing bell admin tetap untuk urgent reminders. Bell portal baru pakai inbox actions. |
| D9 | **Admin balas via tab baru "Komentar Klien" di `/projects/[id]`**. | Konteks lengkap di satu tempat. Tidak butuh inbox global untuk MVP. |
| D10 | **Pakai kolom baru `files.milestone_id`** (nullable FK) untuk grouping file per milestone di portal. Existing `task_id` tetap untuk file yang attached ke task admin. | File draf bab natural-nya per milestone bab. Klien filter via milestone_id. |

---

## 3. Schema Changes

### Migrasi baru
`supabase/migrations/20260523000001_portal_interactive.sql`

```sql
-- 1. milestone_comments — 2-way conversation per milestone
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

-- Admin: full access via milestone -> project ownership
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

-- Client: read all comments on own milestones
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

-- Client: insert own client comments only
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

-- 2. notifications — in-app bell (persistent inbox)
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

-- Insert handled via service-role only (server action helper `notifyUser`).
-- No insert policy = block direct insert via authenticated client.

-- 3. files — extend RLS for client read of visible categories
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

-- 4. files.milestone_id — optional FK untuk grouping di portal
alter table public.files
  add column if not exists milestone_id uuid
    references public.project_milestones(id) on delete set null;
create index if not exists idx_files_milestone on public.files(milestone_id);
```

### Roll-back
1. Drop policy `client reads visible files of own projects`.
2. Drop column `files.milestone_id` (cascade).
3. Drop table `notifications` cascade.
4. Drop table `milestone_comments` cascade.

Tidak ada data loss kecuali yang ditambahkan setelah migrasi.

### Regen types
`pnpm db:types` setelah migrasi push.

---

## 4. Server Actions

### 4.1 `lib/actions/portal-comments.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

    // Fetch user role (cached in cookie via middleware but verify server-side)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const isClient = profile?.role === 'client';
    const authorRole: 'admin' | 'client' = isClient ? 'client' : 'admin';

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

    // Notify counterpart
    await notifyCounterpart(supabase, parsed.data.milestoneId, authorRole, user.id, ins.id);

    revalidatePath(`/portal/proyek/.+`);
    revalidatePath(`/projects/.+`);
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

    // Enrich author display names — join profiles + clients
    const ids = Array.from(new Set((data ?? []).map((r) => r.author_id).filter(Boolean))) as string[];
    const [{ data: profiles }, { data: clients }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('clients').select('client_user_id, full_name, nickname').in('client_user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
    ]);
    const nameBy = new Map<string, string>();
    for (const p of profiles ?? []) nameBy.set(p.id, p.full_name);
    for (const c of clients ?? []) {
      if (c.client_user_id) nameBy.set(c.client_user_id, c.nickname ?? c.full_name);
    }

    return ok(
      (data ?? []).map((r) => ({
        ...r,
        author_name: r.author_id ? (nameBy.get(r.author_id) ?? 'Pengguna') : 'Pengguna',
      })) as MilestoneCommentRow[],
    );
  } catch (e) {
    return fail(e);
  }
}

async function notifyCounterpart(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  milestoneId: string,
  authorRole: 'admin' | 'client',
  authorId: string,
  commentId: string,
) {
  const { data: m } = await supabase
    .from('project_milestones')
    .select('title, project_id, projects!inner(owner_id, client_id, title, clients!inner(client_user_id, full_name))')
    .eq('id', milestoneId)
    .maybeSingle();
  if (!m) return;
  const project = (m as any).projects;
  const client = project?.clients;
  if (!project || !client) return;

  const recipientId = authorRole === 'client' ? project.owner_id : client.client_user_id;
  if (!recipientId || recipientId === authorId) return;

  await notifyUser(recipientId, 'milestone_comment', {
    milestone_id: milestoneId,
    milestone_title: (m as any).title,
    project_id: project.id ?? m.project_id,
    project_title: project.title,
    comment_id: commentId,
    by_role: authorRole,
  });
}
```

### 4.2 `lib/actions/portal-files.ts`

```ts
'use server';

import { ActionError, fail, ok, requireUser, type ActionResult } from './_helper';
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
      .in('category', ['draft', 'final', 'reference'])
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

    // RLS will hide files user shouldn't see.
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
      .createSignedUrl(f.path, 300); // 5 min
    if (e2 || !signed) throw e2 ?? new ActionError('internal', 'Gagal membuat link.');

    return ok({ url: signed.signedUrl, filename: f.filename });
  } catch (e) {
    return fail(e);
  }
}
```

### 4.3 `lib/actions/inbox.ts` (persistent notifications — separate from existing `notifications.ts` urgent-reminders)

```ts
'use server';

import { revalidatePath } from 'next/cache';

import { fail, ok, requireUser, type ActionResult } from './_helper';
import { getServerSupabase } from '@/lib/supabase/server';

export type NotifType =
  | 'milestone_comment'
  | 'milestone_status'
  | 'payment_verified'
  | 'project_status'
  | 'invite_activated';

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

export async function unreadNotificationCount(): Promise<ActionResult<{ count: number }>> {
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

export async function markNotificationRead(id: string): Promise<ActionResult<null>> {
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

### 4.4 `lib/actions/_notify.ts` (helper, server-only)

```ts
import 'server-only';
import { getAdminSupabase } from '@/lib/supabase/admin';
import type { NotifType } from './inbox';

export async function notifyUser(
  userId: string,
  type: NotifType,
  payload: Record<string, unknown>,
): Promise<void> {
  const admin = getAdminSupabase();
  const { error } = await admin.from('notifications').insert({
    user_id: userId,
    type,
    payload,
  });
  if (error) {
    console.error('[notify] failed to insert notification:', error);
  }
}
```

Helper memakai admin (service-role) karena recipient `user_id` ≠ `auth.uid()` (admin trigger notif untuk klien). Wrapped di server action admin-gated → tidak public.

### 4.5 Extend existing actions untuk panggil `notifyUser`

- `lib/actions/projects.ts` → `updateMilestoneStatus`: setelah update sukses, panggil `notifyUser(clients.client_user_id, 'milestone_status', { milestone_id, milestone_title, project_id, project_title, new_status })`.
- `lib/actions/payments.ts` → `verifyPayment`: setelah verify, `notifyUser(clients.client_user_id, 'payment_verified', { payment_id, amount, project_id, project_title })`.
- `lib/actions/portal.ts` → `inviteClientToPortal`: setelah link client_user_id, `notifyUser(invited.user.id, 'invite_activated', { project_count: N })` (opsional, fase nanti).

---

## 5. Zod schemas

`lib/schemas/portal-comments.ts`:

```ts
import { z } from 'zod';

export const PostMilestoneCommentSchema = z.object({
  milestoneId: z.string().uuid(),
  body: z.string().trim().min(1, 'Komentar tidak boleh kosong').max(2000, 'Maks 2000 karakter'),
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

---

## 6. Portal UI

### 6.1 `/portal/proyek/[id]` extended

Existing milestone timeline rows → tambah expand/collapse. Saat expand:

```
[Milestone row #03 — Bab 3 — submitted — Badge brand]
  ▼ Expanded
  ├─ Section "Draf bab" — FileList
  │   • Skripsi_Bab3_v2.docx (1.2 MB · diunggah 18 Mei)        [Download]
  │   • Skripsi_Bab3_v1.docx (1.1 MB · diunggah 10 Mei)        [Download]
  │   atau: <EmptyState compact title="Belum ada draf bab" />
  ├─ Section "Diskusi"
  │   ├─ Comment bubbles (timestamp + author name + role chip)
  │   │   - Admin bubbles: left-aligned, bg-elevated, border
  │   │   - Klien bubbles: right-aligned, bg-brand-soft, no border
  │   └─ <PostCommentBox /> textarea max 2000 + submit "Kirim"
```

State expand local di `<MilestoneDetailDrawer>` (`'use client'`). Lazy load file + comment list on first expand (via server action call).

### 6.2 New components

**`components/portal/milestone-detail-drawer.tsx`** (`'use client'`)
- Props: `milestoneId, title, status`.
- State: `expanded`, `files`, `comments`, `loading`.
- On expand: parallel `listMilestoneFiles` + `listMilestoneComments`.
- Render file list + comment thread + post box.

**`components/portal/file-list-row.tsx`** (`'use client'`)
- Props: `fileId, filename, sizeBytes, uploadedAt`.
- Button "Download" → call `getSignedFileUrl(fileId)` → `window.open(url, '_blank')`.

**`components/portal/comment-thread.tsx`** (server fetch parent, render children)
- Renders bubble list.

**`components/portal/comment-bubble.tsx`** (server component, pure render)
- Props: `comment: MilestoneCommentRow`.
- Layout: avatar/initials + name + role chip + time relative + body wrap.

**`components/portal/post-comment-box.tsx`** (`'use client'`)
- textarea max 2000 + counter.
- onSubmit: server action `postMilestoneComment` → toast.success → trigger parent refresh.

### 6.3 Portal notification bell

**`components/portal/portal-notification-bell.tsx`** (`'use client'`)
- Mount di `<PortalHeader />` di antara avatar dan theme toggle.
- `useEffect` interval 30 detik: `unreadNotificationCount()` → set state.
- Render: `<Popover>` (Radix popover already installed) with badge dot kalau >0.
- Klik bell → render dropdown list 10 notif terbaru (call `listMyNotifications({ limit: 10 })` saat open).
- Klik 1 notif → call `markNotificationRead(id)` + navigate via `href` derived dari payload (e.g. `/portal/proyek/{project_id}#milestone-{milestone_id}`).
- Button "Tandai semua dibaca" di footer → `markAllNotificationsRead()`.

### 6.4 Notification rendering map

```ts
function notifText(n: NotifRow): { title: string; description: string; href: string } {
  const p = n.payload as any;
  switch (n.type) {
    case 'milestone_comment':
      return {
        title: `Balasan baru di ${p.milestone_title ?? 'milestone'}`,
        description: `${p.by_role === 'admin' ? 'Pembimbing' : 'Klien'} mengirim komentar.`,
        href: `/portal/proyek/${p.project_id}#m-${p.milestone_id}`,
      };
    case 'milestone_status':
      return {
        title: `${p.milestone_title} → ${p.new_status}`,
        description: p.project_title ?? '',
        href: `/portal/proyek/${p.project_id}#m-${p.milestone_id}`,
      };
    case 'payment_verified':
      return {
        title: 'Pembayaran terverifikasi',
        description: `${formatRupiah(p.amount)} · ${p.project_title}`,
        href: '/portal/pembayaran',
      };
    // ...others
  }
}
```

Admin variant (untuk bell admin) berbeda routing (e.g. `/projects/${project_id}?tab=comments`).

---

## 7. Admin UI

### 7.1 New tab di `/projects/[id]`

Existing tabs (Overview / Board / Timeline / Files / Finance) → tambah satu:
- **"Komentar Klien"** dengan badge unread count (server fetch saat render).

Tab content (`app/(app)/projects/[id]/comments/page.tsx`):
- List milestones (read-only collapse).
- Per milestone: thread comments + post box.
- Admin post comment via same `postMilestoneComment` (role auto-detect dari `profiles.role`).

### 7.2 Admin notification bell

Existing `components/shared/notification-bell.tsx` adalah **urgent-reminders bell** (derived). Tetap dipertahankan.

Tambah **second bell** `components/shared/inbox-bell.tsx` (atau extend existing) yang reads dari new `notifications` table. Atau: combine ke 1 bell dengan 2 tab ("Urgent" + "Aktivitas"). Untuk MVP: tambahkan tab kedua di existing bell.

Update `components/shared/topbar.tsx` untuk render bell yang sudah extended.

### 7.3 File upload — admin pilih kategori + milestone

Existing `FileUploader` admin → tambah dropdown:
- "Kategori": draft / final / reference / internal (internal tidak visible ke klien).
- "Terkait milestone" (opsional): pilih milestone proyek.

Server action `recordFileMetadata` extended menerima `category` + `milestone_id`. UI di `/projects/[id]/files`.

---

## 8. Storage & file flow

```
Admin upload flow:
  /projects/[id]/files → upload → getSignedUploadUrl (existing) → upload ke bucket
    → recordFileMetadata({ category, milestone_id, ... }) → row di files

Client view flow:
  /portal/proyek/[id] → expand milestone → listMilestoneFiles(milestoneId)
    → RLS: client reads visible files (category in ('draft','final','referensi')
            AND project belongs to client)
    → render list
  Klik download:
    getSignedFileUrl(fileId) → server validate via RLS row exists
    → admin client createSignedUrl 5min → return url
    → window.open(url, '_blank')
```

Tidak ada upload dari klien — read-only download.

---

## 9. Testing

### 9.1 Unit
- `lib/schemas/portal-comments.ts` zod (happy + max-length + uuid validation).
- Notification text mapper (`notifText`) per type.

### 9.2 RLS smoke (`tests/rls/portal-interactive.sql`)
- Admin A insert comment → visible.
- Klien X (linked) insert comment dengan `author_role='client'` → ok, `author_role='admin'` → reject.
- Klien X NOT visible: file kategori 'internal'.
- Klien X NOT visible: notifications milik admin A.

### 9.3 Manual E2E
1. Klien login → buka /portal/proyek/[id] → expand milestone → ketik komentar → submit → bubble muncul.
2. Admin login → /projects/[id]?tab=comments → lihat komentar klien → balas → simpan.
3. Klien refresh → balasan muncul. Bell badge unread sebelum klik → klik balasan → mark-read.
4. Admin upload file kategori 'draft' + milestone_id → klien lihat di milestone drawer → klik download → file terbuka.
5. Admin upload file kategori 'internal' → klien TIDAK lihat di drawer.

---

## 10. Security Checklist

- [x] Comments insert klien dipaksa `author_id = auth.uid()` AND `author_role = 'client'` via RLS with_check.
- [x] Admin cannot impersonate klien (admin policy ALL, tapi insert with `author_role='admin'` lewat action).
- [x] Notifications insert hanya via service-role helper `notifyUser` (no insert policy).
- [x] Signed URL TTL 5 menit; baru di-issue setelah RLS validate row visibility.
- [x] Storage path tidak di-expose ke klien (hanya signedUrl).
- [x] Body length 1–2000 char (DB constraint + zod).
- [x] XSS: render comment body sebagai plain text dengan `whitespace-pre-wrap` (no markdown / HTML interpolation).
- [x] Generic error message kalau action gagal (tidak leak detail).
- [x] requireUser() di setiap action mutasi.

---

## 11. Deployment Sequence

1. Apply migrasi `20260523000001_portal_interactive.sql` via MCP (atau `pnpm supabase db push`).
2. `pnpm db:types` regen types/database.ts.
3. Implement actions + UI per phase di plan dokumen.
4. Smoke test di staging + dev.
5. Deploy ke prod via merge feature branch → main (1 deploy Vercel).
6. Update `docs/08-deployment-devops.md` kalau ada env baru (tidak ada untuk fase ini).

---

## 12. Open Questions / Asumsi

- **Notifikasi admin saat klien komentar:** untuk MVP, dimasukin ke same `notifications` table (admin juga punya rows). Admin bell extend dengan tab kedua.
- **Realtime upgrade path:** kalau volume comment tinggi (>5/menit per project), migrasi ke Supabase Realtime channel subscribe `milestone_comments` filter by milestone_id. Untuk sekarang polling cukup.
- **Storage path convention:** existing path format `<project_id>/<filename>` atau similar. RLS klien tidak peduli — pakai server action layer. Verify saat implementasi.
- **Anchor scroll `#m-{milestone_id}`:** portal page perlu render `id="m-{milestone_id}"` di milestone row supaya klik notif scroll ke milestone yang relevan.

---

## 13. Referensi

- Roadmap: `docs/06-implementation-roadmap.md` (M3 + F2.3 dasar).
- Eskalasi B: `docs/09-monetization-scalability.md` §3.
- Portal MVP spec: `docs/superpowers/specs/2026-05-22-client-portal-design.md`.
- API pattern: `docs/11-api-spec.md`.
- Security policy: `docs/10-security-compliance.md`.

---

**Approval checkpoint:** Spec siap untuk diturunkan ke implementation plan (next step: `superpowers:writing-plans`).
