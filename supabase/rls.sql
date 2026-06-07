-- ============================================================
-- supabase/rls.sql
-- PTC Monitor Dashboard — Row Level Security policies
--
-- Run AFTER supabase/schema.sql once the project is set up.
-- Re-runnable: drops existing policies on the affected tables.
--
-- Access model (matches the previous GAS-based public write model):
--   • anon          → SELECT on every public table
--                    → INSERT/UPDATE/DELETE on runtime tables only
--                      (ptc_action_progress, ptc_meetings, ptc_agendas)
--                    → NO write on master/config tables
--   • authenticated → full CRUD on every public table
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. Cleanup existing policies (safe re-run)
-- ─────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'ptc_recommendations',
        'ptc_actions',
        'ptc_action_progress',
        'ptc_meetings',
        'ptc_agendas',
        'ptc_status_catalog',
        'ptc_fiscal_months'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;


-- ─────────────────────────────────────────────────────────────
-- 1. Enable RLS on every public table
-- ─────────────────────────────────────────────────────────────
alter table public.ptc_recommendations  enable row level security;
alter table public.ptc_actions          enable row level security;
alter table public.ptc_action_progress  enable row level security;
alter table public.ptc_meetings         enable row level security;
alter table public.ptc_agendas          enable row level security;
alter table public.ptc_status_catalog   enable row level security;
alter table public.ptc_fiscal_months    enable row level security;


-- ═════════════════════════════════════════════════════════════
-- 2. Common policies
-- ═════════════════════════════════════════════════════════════

-- 2.1 anon — SELECT allowed on every public table
create policy "anon read recommendations"
  on public.ptc_recommendations
  for select
  to anon
  using (true);

create policy "anon read actions"
  on public.ptc_actions
  for select
  to anon
  using (true);

create policy "anon read action_progress"
  on public.ptc_action_progress
  for select
  to anon
  using (true);

create policy "anon read meetings"
  on public.ptc_meetings
  for select
  to anon
  using (true);

create policy "anon read agendas"
  on public.ptc_agendas
  for select
  to anon
  using (true);

create policy "anon read status_catalog"
  on public.ptc_status_catalog
  for select
  to anon
  using (true);

create policy "anon read fiscal_months"
  on public.ptc_fiscal_months
  for select
  to anon
  using (true);


-- ─────────────────────────────────────────────────────────────
-- 3. Runtime write policies (anon)
--    Public users can update progress, create meetings, edit agendas.
--    Master/config tables stay read-only for anon.
-- ─────────────────────────────────────────────────────────────

-- 3.1 action_progress: anon can insert / update / delete
create policy "anon insert action_progress"
  on public.ptc_action_progress
  for insert
  to anon
  with check (true);

create policy "anon update action_progress"
  on public.ptc_action_progress
  for update
  to anon
  using (true)
  with check (true);

create policy "anon delete action_progress"
  on public.ptc_action_progress
  for delete
  to anon
  using (true);


-- 3.2 meetings: anon can insert / update / delete
create policy "anon insert meetings"
  on public.ptc_meetings
  for insert
  to anon
  with check (true);

create policy "anon update meetings"
  on public.ptc_meetings
  for update
  to anon
  using (true)
  with check (true);

create policy "anon delete meetings"
  on public.ptc_meetings
  for delete
  to anon
  using (true);


-- 3.3 agendas: anon can insert / update / delete
create policy "anon insert agendas"
  on public.ptc_agendas
  for insert
  to anon
  with check (true);

create policy "anon update agendas"
  on public.ptc_agendas
  for update
  to anon
  using (true)
  with check (true);

create policy "anon delete agendas"
  on public.ptc_agendas
  for delete
  to anon
  using (true);


-- ─────────────────────────────────────────────────────────────
-- 4. Authenticated user policies
--    Logged-in users (e.g. PTC admins) get full CRUD on every
--    public table, including master/config tables.
-- ─────────────────────────────────────────────────────────────

create policy "authenticated all recommendations"
  on public.ptc_recommendations
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated all actions"
  on public.ptc_actions
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated all action_progress"
  on public.ptc_action_progress
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated all meetings"
  on public.ptc_meetings
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated all agendas"
  on public.ptc_agendas
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated all status_catalog"
  on public.ptc_status_catalog
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated all fiscal_months"
  on public.ptc_fiscal_months
  for all
  to authenticated
  using (true)
  with check (true);


-- ═════════════════════════════════════════════════════════════
-- 5. Done
-- ═════════════════════════════════════════════════════════════
-- Verify policies (optional):
--   select tablename, policyname, roles, cmd
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
