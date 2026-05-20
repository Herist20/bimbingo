# Custom Fields & Extensibility — Joki Portal

> **Tambahan PRD (revisi G3 + permintaan owner).** Sistem mendukung **custom field per entitas** (mirip Jira / ClickUp / Notion) sehingga admin dapat menambah kolom data tanpa migrasi schema.

---

## 1. Tujuan

Memungkinkan admin menambahkan field tambahan pada entitas inti (klien, proyek, task, pembayaran, dosen) tanpa perlu mengubah kode atau schema database. Contoh kebutuhan riil:

- Klien: tambah field "Asal Kampus (Negeri/Swasta)" dropdown.
- Proyek: tambah field "Sub-bidang penelitian" tag multiselect.
- Task: tambah field "Estimasi Jam" number, "Reviewer" person.
- Pembayaran: tambah field "Channel marketing" text untuk tracking ROAS.

Dipakai untuk:
- **Form CRUD** (input data dengan field tambahan).
- **List view** (kolom tambahan, sortable & filterable).
- **Kanban card** (informasi tambahan di card).
- **Detail view** (section "Field Tambahan").

---

## 2. Model Data — JSONB Approach

Pilihan arsitektur: **JSONB column di setiap tabel domain + tabel meta `custom_fields` untuk schema definition.** Lebih sederhana dari EAV (entity-attribute-value), dan performant via GIN index Postgres.

### 2.1 Kolom `custom_data` di setiap entitas

Tambah ke tabel berikut:

```sql
alter table public.clients   add column custom_data jsonb not null default '{}';
alter table public.projects  add column custom_data jsonb not null default '{}';
alter table public.tasks     add column custom_data jsonb not null default '{}';
alter table public.payments  add column custom_data jsonb not null default '{}';
alter table public.lecturers add column custom_data jsonb not null default '{}';

create index idx_clients_custom_data   on public.clients   using gin(custom_data);
create index idx_projects_custom_data  on public.projects  using gin(custom_data);
create index idx_tasks_custom_data     on public.tasks     using gin(custom_data);
create index idx_payments_custom_data  on public.payments  using gin(custom_data);
create index idx_lecturers_custom_data on public.lecturers using gin(custom_data);
```

Bentuk `custom_data`: peta `field_key → value`.

```jsonc
// contoh tasks.custom_data
{
  "estimasi_jam": 4,
  "reviewer_id": "uuid-of-user",
  "tipe_pekerjaan": "metodologi"
}
```

### 2.2 Tabel `custom_fields` — definisi schema

```sql
create table public.custom_fields (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,

  -- Entity scope
  entity_type     text not null
                    check (entity_type in ('client','project','task','payment','lecturer')),

  -- Cakupan: 'global' = semua entitas tipe ini milik owner.
  -- 'project' = hanya untuk entity_type='task' yang terikat project_id tertentu.
  scope           text not null default 'global'
                    check (scope in ('global','project')),
  scope_ref       uuid,                  -- project_id jika scope='project'

  key             text not null,         -- machine identifier: snake_case
  label           text not null,         -- human label
  description     text,
  field_type      text not null check (field_type in (
                      'text','long_text','number','currency','percent',
                      'date','datetime','boolean',
                      'select','multiselect','user_ref',
                      'url','email','phone'
                    )),
  options         jsonb not null default '[]'::jsonb,
                  -- untuk select/multiselect: [{value, label, color?}, ...]
  required        boolean not null default false,
  default_value   jsonb,
  sequence        smallint not null default 0,

  -- Visibility flag per surface
  show_in_form    boolean not null default true,
  show_in_list    boolean not null default true,
  show_in_card    boolean not null default false,

  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (owner_id, entity_type, scope, scope_ref, key)
);

create index idx_custom_fields_lookup
  on public.custom_fields(owner_id, entity_type, scope, scope_ref)
  where archived_at is null;
```

### 2.3 RLS untuk `custom_fields`

```sql
alter table public.custom_fields enable row level security;

create policy "custom_fields_owner_all"
  on public.custom_fields for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
```

### 2.4 Validasi nilai `custom_data` server-side

Server action menerima input → ambil semua `custom_fields` aktif untuk entity_type → validasi tiap key:

```ts
// lib/customFields/validate.ts
import { z } from 'zod';

export function buildCustomDataValidator(fields: CustomFieldRow[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let v: z.ZodTypeAny;
    switch (f.field_type) {
      case 'text':       v = z.string().max(500); break;
      case 'long_text':  v = z.string().max(10_000); break;
      case 'number':     v = z.number().finite(); break;
      case 'currency':   v = z.number().int().nonnegative(); break;
      case 'percent':    v = z.number().min(0).max(100); break;
      case 'date':       v = z.string().date(); break;
      case 'datetime':   v = z.string().datetime(); break;
      case 'boolean':    v = z.boolean(); break;
      case 'select':     v = z.enum(f.options.map((o: any) => o.value) as [string, ...string[]]); break;
      case 'multiselect':v = z.array(z.enum(f.options.map((o: any) => o.value) as [string, ...string[]])); break;
      case 'user_ref':   v = z.string().uuid(); break;
      case 'url':        v = z.string().url(); break;
      case 'email':      v = z.string().email(); break;
      case 'phone':      v = z.string().regex(/^[+\d\s-]{6,20}$/); break;
      default: v = z.unknown();
    }
    shape[f.key] = f.required ? v : v.optional().nullable();
  }
  return z.object(shape).passthrough();  // passthrough untuk tolerate field lama yang sudah ada di data
}
```

---

## 3. Query Patterns

### 3.1 Filter berdasarkan custom field

```sql
-- Filter tasks dengan custom field 'tipe_pekerjaan' = 'metodologi'
select * from public.tasks
where custom_data ->> 'tipe_pekerjaan' = 'metodologi';

-- Filter multiselect (value 'desain' termasuk)
select * from public.projects
where custom_data -> 'sub_bidang' ? 'desain';
```

### 3.2 Sort berdasarkan custom field

```sql
select * from public.tasks
order by (custom_data ->> 'estimasi_jam')::numeric asc nulls last;
```

### 3.3 Aggregate

```sql
-- Total estimasi jam per proyek
select project_id, sum((custom_data ->> 'estimasi_jam')::numeric) as total_jam
from public.tasks
where custom_data ? 'estimasi_jam'
group by project_id;
```

---

## 4. UI / UX

### 4.1 Multi-View Toggle (M4 revisi)

Setiap halaman list (klien, proyek, task) punya toggle view di kanan atas:

```
[ List ▾ ]  [ Board ]  [ Calendar (P1) ]   [ + Custom view (P2) ]
```

- **List**: tabel TanStack Table. Kolom default + custom columns.
- **Board**: hanya untuk task (group by status). Custom field tampil di card jika `show_in_card=true`.
- Saved per user di localStorage (`view:<entity_type>:<project_id?>` → `'list'|'board'`).

### 4.2 Column Manager

Tombol gear icon "Kelola kolom" di toolbar list view → modal/sheet:

```
┌─ Kelola Kolom ──────────────────────────────────────┐
│  Kolom bawaan (toggle visible)                       │
│  [✓] Nama        [✓] WhatsApp    [✓] Kampus          │
│  [✓] Target Sidang  [ ] NIM                          │
│                                                      │
│  Kolom kustom                            [+ Tambah]  │
│  ⋮ [✓] Asal Kampus    Select         [Edit] [Hapus]  │
│  ⋮ [✓] Marketing channel  Text       [Edit] [Hapus]  │
│                                                      │
│  Urutan: drag handle ⋮ untuk reorder                 │
│                                                      │
│                              [Batal]  [Simpan]       │
└──────────────────────────────────────────────────────┘
```

### 4.3 Form "Tambah Field"

```
┌─ Tambah Field ──────────────────────────────────────┐
│  Nama kolom *   [Estimasi Jam              ]        │
│  Tipe data *    [ Number ▾ ]                        │
│  Key (auto)     estimasi_jam (editable)             │
│  Deskripsi      [...]                               │
│  Wajib diisi    [ ]                                 │
│  Default        [...]                               │
│  Tampil di      [✓] Form  [✓] List  [ ] Card        │
│                                                      │
│  -- jika select/multiselect --                       │
│  Opsi:                                               │
│    [⋮] [Metodologi]  [warna ▾]  [×]                  │
│    [⋮] [Sitasi]      [warna ▾]  [×]                  │
│    [+ tambah opsi]                                   │
│                                                      │
│                              [Batal]  [Simpan]       │
└──────────────────────────────────────────────────────┘
```

### 4.4 Field rendering otomatis

Komponen `<CustomFieldInput field={f} value={v} onChange={..} />` switch berdasarkan `field_type`:

| field_type | Input |
|------------|-------|
| `text` | `<Input/>` |
| `long_text` | `<Textarea/>` |
| `number`/`currency`/`percent` | `<Input type="number"/>` dengan formatter |
| `date`/`datetime` | shadcn `<Calendar/>` popover |
| `boolean` | `<Switch/>` |
| `select` | shadcn `<Select/>` |
| `multiselect` | combobox multi (chip) |
| `user_ref` | combobox dari `profiles` |
| `url`/`email`/`phone` | `<Input/>` dengan inputMode sesuai |

### 4.5 Table column rendering

`<CustomFieldCell field={f} value={v}/>`:
- `select` / `multiselect` → badge dengan warna sesuai option.
- `boolean` → checkmark.
- `date` → format `dd MMM yyyy`.
- `user_ref` → avatar + nama dari `profiles`.
- `currency` → `Rp 1.500.000` formatted.

---

## 5. Acceptance Criteria

- [AC-CF.1] Admin dapat membuka "Kelola Kolom" dari list view klien / proyek / task / pembayaran / dosen.
- [AC-CF.2] Admin dapat menambah, edit, dan hapus (arsip) custom field.
- [AC-CF.3] Field bertipe `select`/`multiselect` mendukung minimal 20 opsi per field dengan label + warna.
- [AC-CF.4] Form CRUD entity menampilkan custom field aktif di section "Field Tambahan" di akhir form, sesuai `show_in_form`.
- [AC-CF.5] Validasi field wajib di-enforce server-side via dynamic zod schema.
- [AC-CF.6] List view menampilkan custom column sesuai `show_in_list`, dapat di-toggle visibilitas per user, dengan reorder.
- [AC-CF.7] List view dapat di-filter & di-sort berdasarkan custom field bertipe sortable (`number`, `date`, `select`).
- [AC-CF.8] Kanban card menampilkan custom field bila `show_in_card=true` (max 3 field).
- [AC-CF.9] Detail entity menampilkan semua custom field aktif di tab/section "Field Tambahan".
- [AC-CF.10] Mengubah `field_type` setelah ada data: **dilarang** (untuk integritas). Sebagai gantinya, admin diminta arsipkan field lama lalu buat yang baru.
- [AC-CF.11] Hapus field permanen → konfirmasi + arsip (soft delete via `archived_at`). Data di `custom_data` masing-masing entity dipertahankan (tidak hilang dari JSONB) supaya bisa restore.
- [AC-CF.12] Task `custom_fields` `scope='project'` hanya tampil di proyek tertentu, scope `global` tampil di semua proyek.

---

## 6. Server Actions (Tambahan ke `11-api-spec.md`)

### `listCustomFields(entityType, scopeRef?)`
- **Input:** `entityType: 'client'|'project'|...`, `scopeRef?: string` (untuk task per-project).
- **Output:** `ActionResult<CustomFieldRow[]>` sorted by `sequence asc`.

### `createCustomField(input)`
- **Input:**
  ```ts
  {
    entity_type, scope?, scope_ref?,
    key?, label, description?, field_type,
    options?: Array<{ value, label, color? }>,
    required?, default_value?,
    show_in_form?, show_in_list?, show_in_card?,
  }
  ```
- **Behavior:** auto-generate `key` dari `label` (slugify ke snake_case) jika tidak diberi. Validasi unik.

### `updateCustomField(id, input)`
- Boleh ubah: `label`, `description`, `required`, `options` (tambah opsi atau ubah label/warna; **jangan hapus value yang sudah dipakai**), `sequence`, `show_in_*`.
- **Dilarang ubah:** `field_type`, `entity_type`, `scope` (return `conflict`).

### `archiveCustomField(id)`
- Soft delete. Field tidak tampil di UI tapi data di `custom_data` tetap ada.

### `restoreCustomField(id)`

### `reorderCustomFields(entityType, scopeRef?, orderedIds)`
- Set `sequence` sesuai urutan input.

### Helper: actions CRUD entity meng-handle `custom_data`

Modifikasi `createClient`/`updateClient`/dst:

```ts
const baseValidated = ClientCreateSchema.parse(input);
const fields = await fetchCustomFields(user.id, 'client');
const customValidator = buildCustomDataValidator(fields);
const customData = customValidator.parse(input.custom_data ?? {});

await supabase.from('clients').insert({
  ...baseValidated,
  owner_id: user.id,
  custom_data: customData,
});
```

---

## 7. Migrasi Schema (Tambahan `02-database-schema.md`)

File baru: `supabase/migrations/0002_custom_fields.sql`:

```sql
-- 1. Tambah kolom custom_data
alter table public.clients   add column custom_data jsonb not null default '{}';
alter table public.projects  add column custom_data jsonb not null default '{}';
alter table public.tasks     add column custom_data jsonb not null default '{}';
alter table public.payments  add column custom_data jsonb not null default '{}';
alter table public.lecturers add column custom_data jsonb not null default '{}';

create index idx_clients_custom_data   on public.clients   using gin(custom_data);
create index idx_projects_custom_data  on public.projects  using gin(custom_data);
create index idx_tasks_custom_data     on public.tasks     using gin(custom_data);
create index idx_payments_custom_data  on public.payments  using gin(custom_data);
create index idx_lecturers_custom_data on public.lecturers using gin(custom_data);

-- 2. Tabel custom_fields (DDL lengkap di section 2.2)

-- 3. RLS (section 2.3)

-- 4. Trigger updated_at
create trigger trg_custom_fields_updated
  before update on public.custom_fields
  for each row execute function public.set_updated_at();
```

---

## 8. Komponen Frontend (Tambahan)

```
components/
└── custom-fields/
    ├── ColumnManager.tsx       # modal "Kelola Kolom"
    ├── FieldEditor.tsx         # form tambah/edit field
    ├── OptionsEditor.tsx       # editor opsi select/multiselect dengan color picker
    ├── CustomFieldInput.tsx    # dynamic input switcher
    ├── CustomFieldCell.tsx     # dynamic table cell renderer
    ├── CustomFieldSection.tsx  # section di form CRUD entity
    └── useCustomFields.ts      # hook fetch + cache via TanStack Query
```

---

## 9. Update Roadmap

Tambah ke `06-implementation-roadmap.md` Minggu 3 (geser polish ke minggu 5 jika perlu):

**Hari 13.5 — Custom Fields (1 hari ekstra → total 21 hari kerja)**
- [ ] Migrasi `0002_custom_fields.sql`.
- [ ] Server actions module `custom_fields`.
- [ ] Komponen `ColumnManager`, `FieldEditor`, `CustomFieldInput`, `CustomFieldCell`.
- [ ] Integrasi ke list klien (sebagai showcase).
- [ ] Integrasi ke form klien & task.
- [ ] E2E test: tambah field "Asal Kampus" → tampil di list & form.

Estimasi konservatif: **+2 hari** (jadi MVP = 22 hari kerja, ~ 4.5 minggu).

---

## 10. Trade-offs

| Pertimbangan | JSONB approach (dipilih) | EAV table |
|--------------|--------------------------|-----------|
| Setup awal | Sangat simpel | Lebih banyak join |
| Query filter/sort | OK dengan GIN index | Lebih kompleks |
| Type safety | Lemah (validasi runtime) | Lebih ketat |
| Schema introspection | Via `custom_fields` meta | Native |
| Bulk update field type | Mudah migrasi | Ribet |
| Cocok untuk MVP | ✅ | ❌ over-engineered |

### Batasan yang diterima
- Tidak ada cross-entity referential integrity di custom field (mis. `user_ref` tidak dijamin valid di DB level — divalidasi di server action).
- Filter di list view kompleks (mis. nested AND/OR multi-field) baru di fase 2.
- Tidak ada formula field (computed). Pertimbangkan di skenario C (SaaS).

---

## 11. Future Extensions

- **Formula field** (compute dari field lain).
- **Rollup field** (aggregate dari child entity, mis. proyek rollup `sum(payments.amount)`).
- **Link field** (referensi antar entity dengan UI lookup).
- **View sharing** (admin lain di tim share saved view).
- **Per-user view config** (saved filter & column visibility per user).
- **AI suggest fields** — saat admin input klien baru, suggest custom field yang biasa diisi.
