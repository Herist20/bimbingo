-- =============================================================
-- Bimbingo — Custom fields (M11)
-- Spec: docs/12-custom-fields-extensibility.md
-- =============================================================

-- 1. Kolom custom_data jsonb di setiap entitas domain
alter table public.clients   add column if not exists custom_data jsonb not null default '{}'::jsonb;
alter table public.projects  add column if not exists custom_data jsonb not null default '{}'::jsonb;
alter table public.tasks     add column if not exists custom_data jsonb not null default '{}'::jsonb;
alter table public.payments  add column if not exists custom_data jsonb not null default '{}'::jsonb;
alter table public.lecturers add column if not exists custom_data jsonb not null default '{}'::jsonb;

create index if not exists idx_clients_custom_data   on public.clients   using gin(custom_data);
create index if not exists idx_projects_custom_data  on public.projects  using gin(custom_data);
create index if not exists idx_tasks_custom_data     on public.tasks     using gin(custom_data);
create index if not exists idx_payments_custom_data  on public.payments  using gin(custom_data);
create index if not exists idx_lecturers_custom_data on public.lecturers using gin(custom_data);

-- 2. Tabel custom_fields
create table if not exists public.custom_fields (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  entity_type     text not null
                    check (entity_type in ('client','project','task','payment','lecturer')),
  scope           text not null default 'global'
                    check (scope in ('global','project')),
  scope_ref       uuid,
  key             text not null,
  label           text not null,
  description     text,
  field_type      text not null check (field_type in (
                    'text','long_text','number','currency','percent',
                    'date','datetime','boolean',
                    'select','multiselect','user_ref',
                    'url','email','phone'
                  )),
  options         jsonb not null default '[]'::jsonb,
  required        boolean not null default false,
  default_value   jsonb,
  sequence        smallint not null default 0,
  show_in_form    boolean not null default true,
  show_in_list    boolean not null default true,
  show_in_card    boolean not null default false,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (owner_id, entity_type, scope, scope_ref, key)
);

create index if not exists idx_custom_fields_lookup
  on public.custom_fields(owner_id, entity_type, scope, scope_ref)
  where archived_at is null;

create trigger trg_custom_fields_updated
  before update on public.custom_fields
  for each row execute function public.set_updated_at();

-- 3. RLS
alter table public.custom_fields enable row level security;
create policy "custom_fields_owner_all" on public.custom_fields
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
