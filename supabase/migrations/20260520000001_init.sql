-- =============================================================
-- Joki Portal — Initial schema
-- Spec: docs/02-database-schema.md
-- =============================================================

-- Pastikan ekstensi yang dibutuhkan tersedia.
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Trigger helper: auto-update kolom updated_at
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null,
  avatar_url      text,
  phone           text,
  role            text not null default 'admin' check (role in ('admin','assistant','viewer')),
  timezone        text not null default 'Asia/Jakarta',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- clients
-- -------------------------------------------------------------
create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  full_name       text not null,
  nickname        text,
  whatsapp        text not null,
  email           text,
  university      text,
  faculty         text,
  major           text,
  student_id      text,
  semester        smallint check (semester between 1 and 20),
  target_defense  date,
  source          text,
  notes           text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_clients_owner
  on public.clients(owner_id)
  where archived_at is null;

create index if not exists idx_clients_target_defense
  on public.clients(target_defense)
  where archived_at is null;

create trigger trg_clients_updated
  before update on public.clients
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- lecturers
-- -------------------------------------------------------------
create table if not exists public.lecturers (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  full_name       text not null,
  title           text,
  university      text,
  faculty         text,
  email           text,
  whatsapp        text,
  characteristics text,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_lecturers_owner on public.lecturers(owner_id);
create index if not exists idx_lecturers_tags  on public.lecturers using gin(tags);

create trigger trg_lecturers_updated
  before update on public.lecturers
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- projects
-- -------------------------------------------------------------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  client_id        uuid not null references public.clients(id) on delete restrict,
  title            text not null,
  type             text not null default 'skripsi'
                     check (type in ('skripsi','tesis','disertasi','tugas-akhir','jurnal','revisi')),
  description      text,
  status           text not null default 'active'
                     check (status in ('draft','active','on-hold','completed','cancelled')),
  total_value      bigint not null default 0 check (total_value >= 0),
  start_date       date,
  target_end_date  date,
  actual_end_date  date,
  archived_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_projects_owner
  on public.projects(owner_id)
  where archived_at is null;

create index if not exists idx_projects_client on public.projects(client_id);

create index if not exists idx_projects_status
  on public.projects(status)
  where archived_at is null;

create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- project_lecturers (junction)
-- -------------------------------------------------------------
create table if not exists public.project_lecturers (
  project_id    uuid not null references public.projects(id) on delete cascade,
  lecturer_id   uuid not null references public.lecturers(id) on delete restrict,
  role          text not null check (role in ('pembimbing-1','pembimbing-2','penguji-1','penguji-2','penguji-3')),
  primary key (project_id, role)
);

create index if not exists idx_project_lecturers_lecturer on public.project_lecturers(lecturer_id);

-- -------------------------------------------------------------
-- project_milestones
-- -------------------------------------------------------------
create table if not exists public.project_milestones (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  title           text not null,
  sequence        smallint not null,
  due_date        date,
  status          text not null default 'not-started'
                    check (status in ('not-started','in-progress','submitted','revisi','approved','done')),
  weight_percent  smallint check (weight_percent between 0 and 100),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (project_id, sequence)
);

create index if not exists idx_milestones_project on public.project_milestones(project_id);

create trigger trg_milestones_updated
  before update on public.project_milestones
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- files (forward-declared agar tasks.proof_file_id valid)
-- -------------------------------------------------------------
create table if not exists public.files (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete cascade,
  task_id         uuid,
  bucket          text not null default 'project-files',
  path            text not null,
  filename        text not null,
  mime_type       text,
  size_bytes      bigint,
  category        text check (category in ('draft','referensi','bukti-bayar','administrasi','final','lainnya')),
  uploaded_at     timestamptz not null default now()
);

create index if not exists idx_files_project on public.files(project_id);
create unique index if not exists uq_files_bucket_path on public.files(bucket, path);

-- -------------------------------------------------------------
-- tasks
-- -------------------------------------------------------------
create table if not exists public.tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  milestone_id    uuid references public.project_milestones(id) on delete set null,
  title           text not null,
  description     text,
  status          text not null default 'backlog'
                    check (status in ('backlog','in-progress','review-dosen','revisi','done')),
  priority        text not null default 'medium'
                    check (priority in ('low','medium','high','urgent')),
  assignee_id     uuid references auth.users(id) on delete set null,
  due_date        date,
  completed_at    timestamptz,
  order_index     double precision not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due
  on public.tasks(due_date)
  where status <> 'done';

create trigger trg_tasks_updated
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Hubungkan files.task_id setelah tasks dibuat.
alter table public.files
  add constraint files_task_id_fkey
  foreign key (task_id) references public.tasks(id) on delete set null;

create index if not exists idx_files_task on public.files(task_id);

-- -------------------------------------------------------------
-- task_comments
-- -------------------------------------------------------------
create table if not exists public.task_comments (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid not null references public.tasks(id) on delete cascade,
  author_id       uuid references auth.users(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_task_comments_task
  on public.task_comments(task_id, created_at desc);

-- -------------------------------------------------------------
-- payments
-- -------------------------------------------------------------
create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  amount            bigint not null check (amount > 0),
  paid_at           date not null,
  method            text not null
                      check (method in ('transfer-bank','qris','e-wallet','tunai','lainnya')),
  reference         text,
  installment_label text,
  proof_file_id     uuid references public.files(id) on delete set null,
  notes             text,
  verified          boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_payments_project on public.payments(project_id, paid_at desc);

-- -------------------------------------------------------------
-- client_notes
-- -------------------------------------------------------------
create table if not exists public.client_notes (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  body            text not null,
  pinned          boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_client_notes_client on public.client_notes(client_id, created_at desc);

-- -------------------------------------------------------------
-- audit_logs
-- -------------------------------------------------------------
create table if not exists public.audit_logs (
  id              bigserial primary key,
  actor_id        uuid references auth.users(id) on delete set null,
  entity_type     text not null,
  entity_id       uuid not null,
  action          text not null,
  before_data     jsonb,
  after_data      jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_entity
  on public.audit_logs(entity_type, entity_id, created_at desc);

-- Trigger audit untuk perubahan status proyek
create or replace function public.log_project_status_change()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (actor_id, entity_type, entity_id, action, before_data, after_data)
    values (
      auth.uid(),
      'project',
      new.id,
      'status_change',
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_project_status_audit on public.projects;
create trigger trg_project_status_audit
  after update on public.projects
  for each row execute function public.log_project_status_change();

-- =============================================================
-- Views
-- =============================================================
create or replace view public.project_finance_summary as
select
  p.id                                                              as project_id,
  p.owner_id,
  p.client_id,
  p.total_value,
  coalesce(sum(pay.amount), 0)                                      as total_paid,
  p.total_value - coalesce(sum(pay.amount), 0)                      as outstanding,
  count(pay.id)                                                     as payment_count,
  max(pay.paid_at)                                                  as last_payment_at
from public.projects p
left join public.payments pay on pay.project_id = p.id
group by p.id;

create or replace view public.project_progress_summary as
select
  p.id                                                              as project_id,
  p.owner_id,
  count(m.id) filter (where m.status in ('approved','done'))        as completed_milestones,
  count(m.id)                                                       as total_milestones,
  coalesce(
    round(
      100.0 * sum(m.weight_percent) filter (where m.status in ('approved','done'))
      / nullif(sum(m.weight_percent), 0),
    0),
    0
  )                                                                 as progress_percent
from public.projects p
left join public.project_milestones m on m.project_id = p.id
group by p.id;

-- =============================================================
-- Row Level Security
-- =============================================================

-- profiles
alter table public.profiles enable row level security;
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_self_insert" on public.profiles
  for insert with check (id = auth.uid());

-- clients
alter table public.clients enable row level security;
create policy "clients_owner_all" on public.clients
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- lecturers
alter table public.lecturers enable row level security;
create policy "lecturers_owner_all" on public.lecturers
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- projects
alter table public.projects enable row level security;
create policy "projects_owner_all" on public.projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- files
alter table public.files enable row level security;
create policy "files_owner_all" on public.files
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- audit_logs
alter table public.audit_logs enable row level security;
create policy "audit_logs_actor_select" on public.audit_logs
  for select using (actor_id = auth.uid());

-- project_lecturers — via parent project
alter table public.project_lecturers enable row level security;
create policy "project_lecturers_via_project" on public.project_lecturers
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_lecturers.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_lecturers.project_id and p.owner_id = auth.uid()
    )
  );

-- project_milestones
alter table public.project_milestones enable row level security;
create policy "project_milestones_via_project" on public.project_milestones
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_milestones.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_milestones.project_id and p.owner_id = auth.uid()
    )
  );

-- tasks
alter table public.tasks enable row level security;
create policy "tasks_via_project" on public.tasks
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

-- task_comments
alter table public.task_comments enable row level security;
create policy "task_comments_via_task" on public.task_comments
  for all
  using (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_comments.task_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_comments.task_id and p.owner_id = auth.uid()
    )
  );

-- payments
alter table public.payments enable row level security;
create policy "payments_via_project" on public.payments
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = payments.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = payments.project_id and p.owner_id = auth.uid()
    )
  );

-- client_notes
alter table public.client_notes enable row level security;
create policy "client_notes_via_client" on public.client_notes
  for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_notes.client_id and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_notes.client_id and c.owner_id = auth.uid()
    )
  );

-- =============================================================
-- Storage bucket policies
-- =============================================================
-- Bucket dibuat manual via dashboard / API. Kebijakan akses:

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists "project_files_owner_select" on storage.objects;
create policy "project_files_owner_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "project_files_owner_insert" on storage.objects;
create policy "project_files_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "project_files_owner_delete" on storage.objects;
create policy "project_files_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
