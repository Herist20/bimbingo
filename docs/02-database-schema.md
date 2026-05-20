# Skema Database — Bimbingo

**Database:** PostgreSQL 15 (via Supabase)
**Region target:** `ap-southeast-1` (Singapore)
**Migrasi:** dikelola via Supabase CLI (`supabase/migrations/*.sql`)

---

## 1. Prinsip Desain

1. **Single-tenant MVP, multi-tenant-ready** — semua tabel utama punya `owner_id` (UUID dari `auth.users`) sebagai persiapan multi-tenant tanpa migrasi mayor.
2. **Soft delete via `archived_at`** — bukan hapus fisik, supaya history klien lama bisa direstore. Hard delete hanya untuk admin via tombol khusus.
3. **Audit-ready** — kolom `created_at`, `updated_at`, dan tabel `audit_logs` terpisah untuk perubahan kritikal.
4. **RLS wajib** untuk semua tabel berisi data domain. Tidak ada query yang bypass RLS dari client.
5. **UUID v4** sebagai primary key. Slug human-friendly disimpan terpisah jika perlu.
6. **Enum sebagai `text` + CHECK constraint** untuk fleksibilitas tanpa migrasi schema saat tambah status.
7. **Currency disimpan sebagai `bigint` dalam satuan rupiah penuh** (bukan sen). Tidak ada konversi mata uang di MVP.

---

## 2. Diagram ER (text-based)

```
auth.users (Supabase managed)
   │
   ├──< profiles (1:1)
   │
   ├──< clients (1:N)         ─< client_notes (1:N)
   │       │
   │       └─< projects (1:N) ─< tasks (1:N) ─< task_comments (1:N)
   │                  │
   │                  ├─< project_milestones (1:N)
   │                  ├─< payments (1:N)
   │                  ├─< files (1:N)
   │                  └─< project_lecturers (1:N) ─> lecturers (N:1)
   │
   └──< audit_logs (1:N)
```

---

## 3. Tabel & Kolom

### 3.1 `profiles`
> Ekstensi `auth.users` untuk metadata admin.

```sql
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text not null,
  avatar_url       text,
  phone            text,
  role             text not null default 'admin' check (role in ('admin','assistant','viewer')),
  timezone         text not null default 'Asia/Jakarta',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

### 3.2 `clients`
> Data mahasiswa klien.

```sql
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  full_name        text not null,
  nickname         text,
  whatsapp         text not null,
  email            text,
  university       text,
  faculty          text,
  major            text,
  student_id       text,             -- NIM
  semester         smallint check (semester between 1 and 20),
  target_defense   date,             -- target tanggal sidang
  source           text,             -- referral, IG, TikTok, dll
  notes            text,             -- catatan umum
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_clients_owner on public.clients(owner_id) where archived_at is null;
create index idx_clients_target_defense on public.clients(target_defense) where archived_at is null;
```

### 3.3 `lecturers`
> Master dosen pembimbing. Disimpan terpisah supaya bisa dipakai lintas klien (mis. 1 dosen membimbing 3 klien).

```sql
create table public.lecturers (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  full_name        text not null,
  title            text,             -- "Dr.", "Prof. Dr.", "M.Si.", dll
  university       text,
  faculty          text,
  email            text,
  whatsapp         text,
  -- catatan karakteristik: free-form supaya cepat dicatat
  characteristics  text,
  -- tag terstruktur untuk filter cepat
  tags             text[] default '{}', -- mis. {'killer','perfeksionis','suka-revisi-besar'}
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_lecturers_owner on public.lecturers(owner_id);
create index idx_lecturers_tags on public.lecturers using gin(tags);
```

### 3.4 `projects`
> Proyek skripsi per klien.

```sql
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  client_id        uuid not null references public.clients(id) on delete restrict,
  title            text not null,
  type             text not null default 'skripsi'
                       check (type in ('skripsi','tesis','disertasi','tugas-akhir','jurnal','revisi')),
  description      text,
  status           text not null default 'active'
                       check (status in ('draft','active','on-hold','completed','cancelled')),
  total_value      bigint not null default 0 check (total_value >= 0),  -- nilai kontrak (Rp)
  start_date       date,
  target_end_date  date,
  actual_end_date  date,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_projects_owner on public.projects(owner_id) where archived_at is null;
create index idx_projects_client on public.projects(client_id);
create index idx_projects_status on public.projects(status) where archived_at is null;
```

### 3.5 `project_lecturers`
> Junction: proyek bisa punya 1–3 dosen pembimbing/penguji.

```sql
create table public.project_lecturers (
  project_id       uuid not null references public.projects(id) on delete cascade,
  lecturer_id      uuid not null references public.lecturers(id) on delete restrict,
  role             text not null check (role in ('pembimbing-1','pembimbing-2','penguji-1','penguji-2','penguji-3')),
  primary key (project_id, role)
);
```

### 3.6 `project_milestones`
> Bab / milestone struktural (Bab 1, Bab 2, ..., Sidang).

```sql
create table public.project_milestones (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  title            text not null,            -- "Bab 1 — Pendahuluan"
  sequence         smallint not null,        -- 1..N untuk urutan tampil
  due_date         date,
  status           text not null default 'not-started'
                       check (status in ('not-started','in-progress','submitted','revisi','approved','done')),
  weight_percent   smallint check (weight_percent between 0 and 100),  -- bobot progres
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (project_id, sequence)
);
```

### 3.7 `tasks`
> Task granular yang menempel ke milestone (atau langsung ke project).

```sql
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  milestone_id     uuid references public.project_milestones(id) on delete set null,
  title            text not null,
  description      text,
  status           text not null default 'backlog'
                       check (status in ('backlog','in-progress','review-dosen','revisi','done')),
  priority         text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assignee_id      uuid references auth.users(id) on delete set null,
  due_date         date,
  completed_at     timestamptz,
  order_index      double precision not null default 0,  -- untuk drag-drop reorder
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due on public.tasks(due_date) where status != 'done';
```

### 3.8 `task_comments`
> Komentar / catatan revisi per task.

```sql
create table public.task_comments (
  id               uuid primary key default gen_random_uuid(),
  task_id          uuid not null references public.tasks(id) on delete cascade,
  author_id        uuid not null references auth.users(id) on delete set null,
  body             text not null,
  created_at       timestamptz not null default now()
);

create index idx_task_comments_task on public.task_comments(task_id, created_at desc);
```

### 3.9 `payments`
> Pencatatan pembayaran masuk per proyek.

```sql
create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  amount           bigint not null check (amount > 0),
  paid_at          date not null,
  method           text not null
                       check (method in ('transfer-bank','qris','e-wallet','tunai','lainnya')),
  reference        text,                  -- nomor referensi transfer, ID transaksi
  installment_label text,                 -- "DP", "Termin 2", "Pelunasan"
  proof_file_id    uuid references public.files(id) on delete set null,
  notes            text,
  verified         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index idx_payments_project on public.payments(project_id, paid_at desc);
```

### 3.10 `files`
> Metadata file. Konten fisik di Supabase Storage bucket.

```sql
create table public.files (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete set null,
  bucket           text not null default 'project-files',
  path             text not null,         -- path di Storage
  filename         text not null,
  mime_type        text,
  size_bytes       bigint,
  category         text check (category in ('draft','referensi','bukti-bayar','administrasi','final','lainnya')),
  uploaded_at      timestamptz not null default now()
);

create index idx_files_project on public.files(project_id);
create unique index uq_files_bucket_path on public.files(bucket, path);
```

### 3.11 `client_notes`
> Timeline catatan bebas per klien (chat dengan dosbing, kejadian khusus).

```sql
create table public.client_notes (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  body             text not null,
  pinned           boolean not null default false,
  created_at       timestamptz not null default now()
);
```

### 3.12 `audit_logs`
> Trail untuk perubahan kritikal (status proyek, pembayaran, hapus klien).

```sql
create table public.audit_logs (
  id               bigserial primary key,
  actor_id         uuid references auth.users(id) on delete set null,
  entity_type      text not null,   -- 'project','payment','client','task'
  entity_id        uuid not null,
  action           text not null,   -- 'create','update','delete','status_change'
  before_data      jsonb,
  after_data       jsonb,
  created_at       timestamptz not null default now()
);

create index idx_audit_entity on public.audit_logs(entity_type, entity_id, created_at desc);
```

---

## 4. Views & Materialized Views

### 4.1 `project_finance_summary` (view)
> Ringkasan keuangan per proyek — dipanggil di dashboard tanpa N+1 query.

```sql
create or replace view public.project_finance_summary as
select
  p.id                                  as project_id,
  p.owner_id,
  p.client_id,
  p.total_value,
  coalesce(sum(pay.amount), 0)          as total_paid,
  p.total_value - coalesce(sum(pay.amount), 0) as outstanding,
  count(pay.id)                         as payment_count,
  max(pay.paid_at)                      as last_payment_at
from public.projects p
left join public.payments pay on pay.project_id = p.id
group by p.id;
```

### 4.2 `project_progress_summary` (view)
> Persentase progres dari milestone yang sudah `done` / `approved`.

```sql
create or replace view public.project_progress_summary as
select
  p.id                                  as project_id,
  p.owner_id,
  count(m.id) filter (where m.status in ('approved','done')) as completed_milestones,
  count(m.id)                                                as total_milestones,
  coalesce(
    round(
      100.0 * sum(m.weight_percent) filter (where m.status in ('approved','done'))
      / nullif(sum(m.weight_percent), 0),
    0),
    0
  ) as progress_percent
from public.projects p
left join public.project_milestones m on m.project_id = p.id
group by p.id;
```

---

## 5. Row Level Security (RLS)

Semua tabel domain **wajib** RLS enabled. Kebijakan dasar:

> _Pengguna hanya dapat melihat/memodifikasi baris yang `owner_id`-nya = `auth.uid()`._

### 5.1 Template policy

```sql
alter table public.clients enable row level security;

create policy "clients_select_owner" on public.clients
  for select using (owner_id = auth.uid());

create policy "clients_insert_owner" on public.clients
  for insert with check (owner_id = auth.uid());

create policy "clients_update_owner" on public.clients
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "clients_delete_owner" on public.clients
  for delete using (owner_id = auth.uid());
```

Pola sama diterapkan untuk: `lecturers`, `projects`, `files`, `audit_logs`.

### 5.2 Policy turunan (via parent)
Untuk tabel yang tidak punya `owner_id` langsung (mis. `tasks`, `payments`, `project_milestones`, `task_comments`), policy memeriksa kepemilikan lewat parent `projects`:

```sql
alter table public.tasks enable row level security;

create policy "tasks_owner_via_project" on public.tasks
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id and p.owner_id = auth.uid()
    )
  );
```

### 5.3 Storage policy
Bucket `project-files` hanya bisa diakses pemilik file:

```sql
create policy "project_files_owner_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_files_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

Konvensi path file: `<owner_id>/<project_id>/<random-uuid>-<filename>`.

---

## 6. Triggers & Functions

### 6.1 Auto-update `updated_at`

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply ke semua tabel yang punya kolom updated_at
create trigger trg_clients_updated   before update on public.clients
  for each row execute function public.set_updated_at();
create trigger trg_projects_updated  before update on public.projects
  for each row execute function public.set_updated_at();
-- ulangi untuk profiles, lecturers, project_milestones, tasks
```

### 6.2 Auto-create profile saat user signup

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 6.3 Auto-audit log untuk perubahan status proyek

```sql
create or replace function public.log_project_status_change()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (actor_id, entity_type, entity_id, action, before_data, after_data)
    values (auth.uid(), 'project', new.id, 'status_change',
            jsonb_build_object('status', old.status),
            jsonb_build_object('status', new.status));
  end if;
  return new;
end;
$$;

create trigger trg_project_status_audit
  after update on public.projects
  for each row execute function public.log_project_status_change();
```

---

## 7. Seed Data (Development)

File `supabase/seed.sql` untuk dev local:

```sql
-- Hanya berjalan di environment local
insert into public.lecturers (owner_id, full_name, title, university, characteristics, tags)
values
  ('00000000-0000-0000-0000-000000000001', 'Bambang Prakoso', 'Dr.', 'Universitas Contoh',
   'Suka revisi terkait sitasi dan metodologi. Respon cepat di pagi hari.',
   array['detail','responsif']),
  ('00000000-0000-0000-0000-000000000001', 'Sari Wulandari', 'Prof. Dr.', 'Universitas Contoh',
   'Killer dosen. Wajib referensi minimal 50 jurnal terindeks Scopus.',
   array['killer','perfeksionis']);
```

---

## 8. Strategi Migrasi

- **Tool:** Supabase CLI (`supabase migration new <name>` → file SQL di `supabase/migrations/`).
- **Naming:** `YYYYMMDDHHMMSS_<deskripsi-snake-case>.sql`.
- **Aturan emas:**
  1. **Tidak ada migrasi destruktif tanpa review** (drop column, drop table) di production.
  2. Untuk rename kolom: tambah kolom baru → copy data → drop kolom lama (2 migrasi terpisah).
  3. Migrasi dijalankan oleh Vercel build hook atau manual via `supabase db push`.
- **Branching:** gunakan Supabase Branches untuk testing skema baru tanpa menyentuh prod.

---

## 9. Estimasi Kapasitas Free Tier

| Resource | Free tier | Estimasi MVP (50 klien aktif, 6 bulan) |
|----------|-----------|----------------------------------------|
| Database storage | 500 MB | ~ 50 MB (estimasi 10 KB / klien × 50 + 5 KB / project × 100 = ~ 1 MB metadata; sisanya audit logs) |
| Storage bucket | 1 GB | ~ 200 MB (asumsi 5 file × 4 MB × 10 proyek aktif) |
| Bandwidth | 5 GB / bln | Mudah dipenuhi (admin tunggal akses normal) |
| Realtime concurrent | 200 | Hanya 1 admin connection |
| Edge Function invocations | 500K / bln | Tidak dipakai di MVP |

**Aman di free tier sampai ~ 100 klien aktif.** Upgrade ke Pro ($25/bln) saat mendekati 80% kuota.

---

## 10. Checklist Implementasi Skema

- [ ] Buat project Supabase di region `ap-southeast-1`.
- [ ] Push migrasi pertama berisi semua DDL di section 3.
- [ ] Aktifkan RLS di semua tabel + apply policies section 5.
- [ ] Buat bucket Storage `project-files` (private).
- [ ] Apply triggers section 6.
- [ ] Generate TypeScript types: `pnpm supabase gen types typescript --project-id <id> > types/database.ts`.
- [ ] Smoke test RLS dengan 2 user terpisah (cek tidak bisa lihat data masing-masing).
- [ ] Aktifkan auto-backup di Supabase dashboard.
