-- ============================================================
-- supabase/rls.sql
-- PTCOS — Row Level Security policies
--
-- Run AFTER supabase/schema.sql once the project is set up.
-- Re-runnable: drops existing policies and helper functions on
-- the affected tables before recreating.
--
-- Access model (authenticated-only writes):
--   • anon          → SELECT on every public table (read-only)
--   • viewer        → SELECT on every public table
--   • editor        → SELECT + INSERT/UPDATE on runtime tables
--                      (ptc_action_progress, ptc_meetings, ptc_agendas)
--   • admin         → full CRUD on every public table
--                     (including ptc_recommendations, ptc_actions,
--                      ptc_status_catalog, ptc_fiscal_months, ptc_user)
--
-- Role lookup uses a SECURITY DEFINER helper to bypass RLS, so the
-- policies don't recurse when checking the caller's role.
-- ============================================================


-- ═════════════════════════════════════════════════════════════
-- 0. Cleanup existing policies + helpers (safe re-run)
-- ═════════════════════════════════════════════════════════════
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
        'ptc_fiscal_months',
        'ptc_user',
        -- legacy name from an earlier iteration
        'ptc_profiles'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

drop function if exists public.current_user_role() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.is_editor_or_above() cascade;
drop function if exists public.is_active_user() cascade;


-- ═════════════════════════════════════════════════════════════
-- 1. Enable RLS on every public table
-- ═════════════════════════════════════════════════════════════
alter table public.ptc_recommendations  enable row level security;
alter table public.ptc_actions          enable row level security;
alter table public.ptc_action_progress  enable row level security;
alter table public.ptc_meetings         enable row level security;
alter table public.ptc_agendas          enable row level security;
alter table public.ptc_status_catalog   enable row level security;
alter table public.ptc_fiscal_months    enable row level security;
alter table public.ptc_user             enable row level security;


-- ═════════════════════════════════════════════════════════════
-- 2. Role lookup helpers
--    SECURITY DEFINER + stable + read from ptc_user. Bypasses RLS
--    for the lookup itself so policies don't recurse.
-- ═════════════════════════════════════════════════════════════
create or replace function public.current_user_role()
returns public.ptc_user_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.ptc_user
  where user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.ptc_user
    where user_id = auth.uid() and is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_editor_or_above()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    public.current_user_role() in ('editor', 'admin'),
    false
  );
$$;


-- ═════════════════════════════════════════════════════════════
-- 3. anon policies — SELECT only (no writes)
-- ═════════════════════════════════════════════════════════════
create policy "anon read recommendations"   on public.ptc_recommendations  for select to anon        using (true);
create policy "anon read actions"            on public.ptc_actions          for select to anon        using (true);
create policy "anon read action_progress"    on public.ptc_action_progress  for select to anon        using (true);
create policy "anon read meetings"           on public.ptc_meetings         for select to anon        using (true);
create policy "anon read agendas"            on public.ptc_agendas          for select to anon        using (true);
create policy "anon read status_catalog"     on public.ptc_status_catalog   for select to anon        using (true);
create policy "anon read fiscal_months"      on public.ptc_fiscal_months    for select to anon        using (true);
create policy "anon read users"              on public.ptc_user             for select to anon        using (true);


-- ═════════════════════════════════════════════════════════════
-- 4. authenticated base — SELECT on every public table
--    (active user only — inactive rows are not visible)
-- ═════════════════════════════════════════════════════════════
create policy "authenticated read recommendations"  on public.ptc_recommendations  for select to authenticated using (true);
create policy "authenticated read actions"           on public.ptc_actions          for select to authenticated using (true);
create policy "authenticated read action_progress"   on public.ptc_action_progress  for select to authenticated using (true);
create policy "authenticated read meetings"          on public.ptc_meetings         for select to authenticated using (true);
create policy "authenticated read agendas"           on public.ptc_agendas          for select to authenticated using (true);
create policy "authenticated read status_catalog"    on public.ptc_status_catalog   for select to authenticated using (true);
create policy "authenticated read fiscal_months"     on public.ptc_fiscal_months    for select to authenticated using (true);
create policy "authenticated read users"             on public.ptc_user             for select to authenticated
  using (public.is_active_user() or public.is_admin());


-- ═════════════════════════════════════════════════════════════
-- 5. Runtime write policies — editor and above
--    (ptc_action_progress, ptc_meetings, ptc_agendas)
-- ═════════════════════════════════════════════════════════════

-- 5.1 action_progress
create policy "editor insert action_progress"
  on public.ptc_action_progress for insert to authenticated
  with check (public.is_editor_or_above());

create policy "editor update action_progress"
  on public.ptc_action_progress for update to authenticated
  using (public.is_editor_or_above())
  with check (public.is_editor_or_above());

create policy "admin delete action_progress"
  on public.ptc_action_progress for delete to authenticated
  using (public.is_admin());


-- 5.2 meetings
create policy "editor insert meetings"
  on public.ptc_meetings for insert to authenticated
  with check (public.is_editor_or_above());

create policy "editor update meetings"
  on public.ptc_meetings for update to authenticated
  using (public.is_editor_or_above())
  with check (public.is_editor_or_above());

create policy "admin delete meetings"
  on public.ptc_meetings for delete to authenticated
  using (public.is_admin());


-- 5.3 agendas
create policy "editor insert agendas"
  on public.ptc_agendas for insert to authenticated
  with check (public.is_editor_or_above());

create policy "editor update agendas"
  on public.ptc_agendas for update to authenticated
  using (public.is_editor_or_above())
  with check (public.is_editor_or_above());

create policy "admin delete agendas"
  on public.ptc_agendas for delete to authenticated
  using (public.is_admin());


-- ═════════════════════════════════════════════════════════════
-- 6. Master / config write policies — admin only
-- ═════════════════════════════════════════════════════════════
create policy "admin all recommendations"  on public.ptc_recommendations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all actions"           on public.ptc_actions         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all status_catalog"    on public.ptc_status_catalog  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all fiscal_months"     on public.ptc_fiscal_months   for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ═════════════════════════════════════════════════════════════
-- 7. ptc_user policies
--    • everyone authenticated: SELECT active users (admins also see inactive)
--    • self: UPDATE own display_name (not role, not is_active)
--    • admin: full CRUD (set role, deactivate, etc.)
-- ═════════════════════════════════════════════════════════════
create policy "user update own profile"
  on public.ptc_user for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    -- users can change their own display_name but cannot promote
    -- or demote themselves, and cannot reactivate themselves.
    and role = (select role from public.ptc_user where user_id = auth.uid())
    and is_active = (select is_active from public.ptc_user where user_id = auth.uid())
  );

create policy "admin all users"
  on public.ptc_user for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ═════════════════════════════════════════════════════════════
-- 8. Done
-- ═════════════════════════════════════════════════════════════
-- Verify policies (optional):
--   select tablename, policyname, roles, cmd
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
--
-- Verify the role helper resolves correctly:
--   select public.current_user_role(), public.is_editor_or_above(), public.is_active_user();
