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
