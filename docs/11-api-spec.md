# API Spec — Joki Portal

> MVP menggunakan **Server Actions** (`'use server'`) — bukan REST API publik. Dokumen ini mendefinisikan kontrak input/output setiap action supaya FE & BE konsisten. REST/JSON API akan ditambah di fase 2 saat ada client portal / mobile app.

---

## 1. Konvensi

- Semua action **return objek typed**, tidak `void`. Bentuk standar:

  ```ts
  type ActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string; fields?: Record<string, string[]> } };
  ```

- Validasi input dengan **zod**. Schema di `lib/schemas/*.ts`, shared antara client & server.
- Setiap action **memanggil `revalidatePath`** atau `revalidateTag` yang sesuai.
- Authentication check di setiap action: panggil `supabase.auth.getUser()` di awal; tolak jika unauthorized.
- Errors:
  - `code = 'unauthorized'` (401-ish)
  - `code = 'validation_error'` (400) + `fields`
  - `code = 'not_found'` (404)
  - `code = 'conflict'` (409, mis. unique constraint)
  - `code = 'internal'` (500)

### Helper standar

```ts
// lib/actions/_helper.ts
'use server';

import { getServerSupabase } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export async function requireUser(): Promise<User> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ActionError('unauthorized', 'Sesi tidak valid');
  return data.user;
}

export class ActionError extends Error {
  constructor(
    public code: 'unauthorized' | 'validation_error' | 'not_found' | 'conflict' | 'internal',
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export function ok<T>(data: T) {
  return { ok: true as const, data };
}

export function fail(err: unknown) {
  if (err instanceof ActionError) {
    return { ok: false as const, error: { code: err.code, message: err.message, fields: err.fields } };
  }
  console.error(err);
  return { ok: false as const, error: { code: 'internal' as const, message: 'Terjadi kesalahan internal' } };
}
```

---

## 2. Module: Auth

> Sebagian besar dihandle Supabase JS langsung dari client. Action server hanya untuk logout di server.

### `signOut()`
- **Input:** `void`
- **Output:** `ActionResult<{}>`
- **Side effects:** hapus cookie session via `supabase.auth.signOut()`, `redirect('/login')`.

---

## 3. Module: Clients

### `createClient(input)`
- **Input schema:** `ClientCreateSchema` (lihat `10-security-compliance.md` section 5).
- **Output:** `ActionResult<{ id: string }>`
- **RLS effect:** `owner_id = auth.uid()` auto-set di action.
- **Revalidate:** `/clients`, `/`.

### `updateClient(id, input)`
- **Input:** `id: string`, `input: ClientUpdateSchema` (partial).
- **Output:** `ActionResult<{ id: string }>`
- **Revalidate:** `/clients`, `/clients/[id]`.

### `archiveClient(id)`
- **Input:** `id: string`.
- **Output:** `ActionResult<{}>`
- **Effect:** `update clients set archived_at = now() where id = $1`.

### `restoreClient(id)`
- Sebaliknya. `archived_at = null`.

### `deleteClientPermanent(id)`
- Hard delete. Wajib konfirmasi UI (AlertDialog dengan ketik nama klien untuk konfirmasi).
- Cascade akan menghapus proyek, task, pembayaran, file metadata. **File fisik di Storage diharapkan ikut dihapus via trigger** (atau cleanup job berkala).

---

## 4. Module: Lecturers

### `createLecturer(input)` / `updateLecturer(id, input)` / `deleteLecturer(id)`
Standard CRUD. Schema:

```ts
const LecturerSchema = z.object({
  full_name: z.string().min(2).max(100),
  title: z.string().max(50).optional(),
  university: z.string().max(150).optional(),
  faculty: z.string().max(150).optional(),
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  characteristics: z.string().max(2000).optional(),
  tags: z.array(z.string().max(40)).max(10).default([]),
});
```

### `searchLecturers(query)`
- **Input:** `query: string` (min 1 char).
- **Output:** `ActionResult<Lecturer[]>` (max 20 hasil).
- Untuk combobox.

---

## 5. Module: Projects

### `createProject(input)`
- **Input:**
  ```ts
  {
    client_id: string,
    title: string,
    type: 'skripsi'|'tesis'|'disertasi'|'tugas-akhir'|'jurnal'|'revisi',
    description?: string,
    total_value: number,            // rupiah penuh
    start_date?: string,
    target_end_date?: string,
    milestones?: Array<{
      title: string,
      sequence: number,
      due_date?: string,
      weight_percent?: number,
    }>,
    lecturers?: Array<{ lecturer_id: string, role: ProjectLecturerRole }>,
  }
  ```
- **Output:** `ActionResult<{ id: string }>`
- **Behavior:** transaksional — buat project + milestones + project_lecturers. Jika `milestones` tidak diberi → auto-generate 6 default (Bab 1-5 + Sidang).
- **Revalidate:** `/projects`, `/clients/[id]`, `/`.

### `updateProject(id, input)`
- Partial update.
- Tidak boleh ubah `client_id` (jaga integritas history).

### `changeProjectStatus(id, status)`
- **Input:** status enum.
- **Effect:** trigger audit log otomatis (via trigger DB di section 6.3 `02-database-schema.md`).

### `attachLecturer(projectId, lecturerId, role)` / `detachLecturer(projectId, role)`
- Manipulasi `project_lecturers` junction.

---

## 6. Module: Milestones

### `upsertMilestones(projectId, items)`
- **Input:** array milestone (create/update by id-presence).
- **Effect:** validate `weight_percent` total ≤ 100, sequence unik. Delete milestones yang tidak ada di array (kecuali yang dilindungi flag).

### `updateMilestoneStatus(id, status)`
- Trigger update progress view.

---

## 7. Module: Tasks

### `createTask(input)`
- **Input:**
  ```ts
  {
    project_id: string,
    milestone_id?: string,
    title: string,
    description?: string,
    priority?: 'low'|'medium'|'high'|'urgent',
    due_date?: string,
    assignee_id?: string,
  }
  ```
- Default `status = 'backlog'`, `order_index` = max + 1000.

### `updateTask(id, input)`
- Partial update field non-status.

### `updateTaskStatus(id, status)`
- **Input:** `id`, `status`.
- **Effect:**
  - If `status === 'done'` → `completed_at = now()`.
  - Else jika sebelumnya `done` → `completed_at = null`.
- **Realtime trigger:** Supabase broadcast ke channel `project:<projectId>`.

### `reorderTask(id, newOrderIndex)`
- **Input:** `id`, `newOrderIndex: number`.
- Fractional positioning (mis. drop antara 1000 dan 2000 → 1500).

### `deleteTask(id)`

### `addTaskComment(taskId, body)`
- **Input:** `taskId`, `body: string` (min 1, max 5000).

---

## 8. Module: Payments

### `recordPayment(input)`
- **Input:**
  ```ts
  {
    project_id: string,
    amount: number,                          // rupiah, > 0
    paid_at: string,                         // ISO date
    method: 'transfer-bank'|'qris'|'e-wallet'|'tunai'|'lainnya',
    reference?: string,
    installment_label?: string,
    proof_file_id?: string,                  // jika sudah upload dulu
    notes?: string,
    verified?: boolean,                      // default false
  }
  ```
- **Effect:** insert + revalidate finance pages + audit log.

### `verifyPayment(id)` / `unverifyPayment(id)`
- Toggle `verified` boolean.

### `updatePayment(id, input)` / `deletePayment(id)`
- Audit log mandatori (before/after JSON).

### `summarizeFinance(filter)`
- **Input:** `{ from?: string, to?: string, projectId?: string }`.
- **Output:** `ActionResult<{ total: number, count: number, byMethod: Record<Method, number>, byMonth: Array<{ month: string, total: number }> }>`.
- Dipakai di halaman `/finance`.

---

## 9. Module: Files

### `getSignedUploadUrl(input)`
- **Input:**
  ```ts
  {
    project_id: string,
    task_id?: string,
    filename: string,                       // sanitized
    content_type: string,                   // mime
    category?: FileCategory,
  }
  ```
- **Effect:** validasi mime type, max-size hint, generate path `<userId>/<projectId>/<uuid>-<filename>`, return signed URL (expire 5 menit).
- **Output:** `ActionResult<{ uploadUrl: string, path: string, token: string }>`.

### `recordFileMetadata(input)`
- Dipanggil **setelah** browser sukses upload ke signed URL.
- **Input:**
  ```ts
  {
    project_id: string,
    task_id?: string,
    path: string,
    filename: string,
    mime_type: string,
    size_bytes: number,
    category?: FileCategory,
  }
  ```
- Insert ke `files`.

### `getSignedDownloadUrl(fileId)`
- **Output:** signed URL expire 1 jam.

### `deleteFile(fileId)`
- Hapus blob storage + row DB.

---

## 10. Module: Dashboard

### `getDashboardSummary()`
- **Output:**
  ```ts
  {
    active_clients: number,
    active_projects: number,
    revenue_this_month: number,
    total_outstanding: number,
    upcoming_deadlines: Array<{ task_id: string, title: string, due_date: string, project_title: string, client_name: string }>,
    stale_projects: Array<{ project_id: string, title: string, client_name: string, last_updated_at: string }>,
    revenue_chart: Array<{ month: string, total: number }>,  // 6 bulan terakhir
  }
  ```

Implementasi: gabungan beberapa query ke views `project_finance_summary`, `project_progress_summary`, tabel `tasks`, `payments`. Dijalankan paralel via `Promise.all` di RSC.

---

## 11. Module: Search

### `globalSearch(query)` (fase 2)
- **Input:** `query: string`.
- **Output:** array hasil dari multiple entity:
  ```ts
  Array<
    | { type: 'client', id, name, subtitle }
    | { type: 'project', id, title, subtitle }
    | { type: 'task', id, title, subtitle }
    | { type: 'lecturer', id, name, subtitle }
  >
  ```
- Limit 5 per entity.

---

## 12. REST API (Fase 2 — Outline)

Saat client portal & mobile app ditambahkan:

| Endpoint | Method | Auth |
|----------|--------|------|
| `POST /api/v1/auth/login` | POST | None |
| `POST /api/v1/auth/refresh` | POST | Refresh token |
| `GET /api/v1/projects` | GET | Bearer (admin) |
| `GET /api/v1/projects/:id` | GET | Bearer (admin atau client linked) |
| `GET /api/v1/projects/:id/progress` | GET | Bearer (client) |
| `GET /api/v1/payments/:id` | GET | Bearer (client owner) |
| `POST /api/v1/webhooks/midtrans` | POST | Signature verify |
| `POST /api/v1/webhooks/xendit` | POST | Signature verify |

Detail di-update saat fase 2.B implementasi.

---

## 13. Webhooks (Fase 2)

### Midtrans callback `/api/webhooks/midtrans`
- Verifikasi signature SHA-512.
- Update `payments.verified = true` jika status = settlement/capture.
- Audit log + notif WA opt-in.

### Xendit callback `/api/webhooks/xendit`
- Verifikasi X-CALLBACK-TOKEN.

Format payload disimpan di tabel `webhook_logs` (raw json, untuk debug).

---

## 14. Rate Limiting

- Tidak ada rate limit aplikasi level di MVP (admin tunggal). Supabase Auth tetap rate-limit login.
- Fase 2 (client portal): pakai Upstash Redis (free tier) untuk per-IP & per-user limit.

---

## 15. Versioning

- Server Actions tidak ada versioning (single deploy = single version).
- REST API fase 2 prefix `/api/v1/`. Bila breaking change → `/api/v2/`.

---

## 16. Error Codes Reference

| Code | HTTP eq | UI behavior |
|------|---------|-------------|
| `unauthorized` | 401 | Toast + redirect ke `/login` |
| `forbidden` | 403 | Toast "Tidak punya akses" |
| `not_found` | 404 | Halaman 404 atau toast |
| `validation_error` | 400 | Inline error pada field (gunakan `fields`) |
| `conflict` | 409 | Toast spesifik (mis. "Email sudah dipakai") |
| `rate_limited` | 429 | Toast "Coba lagi sebentar" |
| `internal` | 500 | Toast generic + log ke Sentry (fase 2) |

---

## 17. Contoh End-to-End

### Form submit klien baru

```tsx
'use client';
import { useTransition } from 'react';
import { createClient } from '@/lib/actions/clients';

export function NewClientForm() {
  const [pending, start] = useTransition();
  function onSubmit(formData: FormData) {
    start(async () => {
      const result = await createClient({
        full_name: formData.get('full_name'),
        whatsapp: formData.get('whatsapp'),
        // ...
      });
      if (!result.ok) {
        if (result.error.code === 'validation_error') {
          setFieldErrors(result.error.fields);
        } else {
          toast.error(result.error.message);
        }
        return;
      }
      toast.success('Klien berhasil disimpan');
      router.push(`/clients/${result.data.id}`);
    });
  }
  // ... render form
}
```

Server side:

```ts
// lib/actions/clients.ts
'use server';
import { ClientCreateSchema } from '@/lib/schemas/client';
import { requireUser, ok, fail, ActionError } from './_helper';
import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

export async function createClient(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = ClientCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError('validation_error', 'Input tidak valid', parsed.error.flatten().fieldErrors);
    }
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...parsed.data, owner_id: user.id })
      .select('id')
      .single();
    if (error) throw error;
    revalidatePath('/clients');
    revalidatePath('/');
    return ok({ id: data.id });
  } catch (e) {
    return fail(e);
  }
}
```

---

## 18. Generated Types

Tipe DB di-generate dari Supabase CLI. Tipe domain turunan ditulis manual di `types/domain.ts`:

```ts
// types/domain.ts
import type { Database } from './database';
export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];
// ... mirror untuk semua tabel utama
```

Re-generate setelah migrasi:

```bash
pnpm db:types
```
