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
