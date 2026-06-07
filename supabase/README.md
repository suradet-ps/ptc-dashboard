# Supabase — PTC Monitor Dashboard

SQL files for bootstrapping and configuring a Supabase project to support the PTC Dashboard.

## Files in this folder

| File | Description | When to run |
|---|---|---|
| `schema.sql` | DDL: tables / views / indexes / triggers + seed data + auth helpers | Once at first install (re-runnable) |
| `rls.sql` | Row Level Security policies + role helpers | After `schema.sql` (re-runnable) |

## Schema overview

All tables use the `ptc_` prefix to keep them isolated from other objects in the project.

### Master / config (read-only outside `admin`)

- **`ptc_recommendations`** (3 rows) — recommendations R1/R2/R3 (title, short_title, color_key, hex_color)
- **`ptc_actions`** (12 rows) — action plans R1A1..R3A4 (plan, sub_items[], timeline, kpis[], target, owners[], report_cycle, ha_ref)
- **`ptc_status_catalog`** (5 rows) — status configuration (label, tailwind classes, hex)
- **`ptc_fiscal_months`** (12 rows) — fiscal year months (month_no 1–12 → Thai label + calendar_month)

### Runtime (read by anyone, written by `editor`+)

- **`ptc_action_progress`** (12 rows, 1:1 with `ptc_actions`) — runtime status (status, progress_pct, actual_value, notes, blockers, last_updated, updated_by)
- **`ptc_meetings`** — PTC meetings (meeting_date, title, status, report_url)
- **`ptc_agendas`** — meeting agenda items (FK → `ptc_meetings`)

### Auth & identity

- **`ptc_user_role`** — enum: `viewer` | `editor` | `admin`
- **`ptc_user`** (1:1 with `auth.users`) — email, display_name, role, is_active. Auto-created on user creation by a trigger on `auth.users`. The first user to be added becomes `admin` so the system bootstraps without manual SQL.
- **`ptc_v_actions_full`** — join of actions + progress + recommendations, fetched in a single query
- **`ptc_v_action_progress_with_author`** — progress rows joined to ptc_user so the UI can render `display_name` from the audit `updated_by` email

### User management model (no public signups)

The dashboard **does not** allow self-service sign-up. All users are created by an admin in two steps:

1. **Create the auth user** in **Supabase Dashboard → Authentication → Users → Add user** (email + password, optionally auto-confirm)
2. **Set the role** in the dashboard at **/admin/users** (admin only) — or via SQL:
   ```sql
   update ptc_user set role = 'admin' where email = 'someone@hospital.go.th';
   ```

The `handle_new_user` trigger (in `schema.sql`) auto-creates a `ptc_user` row whenever a new `auth.users` row appears. The first user gets `role = 'admin'` automatically; everyone else defaults to `editor`.

Users sign in via the `/login` page (email + password). The auth flow is **email + password** — magic-link sign-in is intentionally not used because there's no need to email a one-click link to a user who can just type their password.

`is_active = false` is a soft-delete: the row remains for audit history, but the helper `current_user_role()` returns NULL so the user is treated as signed-out by the application.

## Installation

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) → **New project**
2. Choose a region close to your users (e.g. Singapore)
3. Set a database password and save it securely

### 2. Enable Email + Password sign-in (Auth providers)

In the Supabase Dashboard:

- **Authentication → Providers → Email** — enable Email provider
- **Authentication → Sign In / Up → User Signups** — turn **OFF** "Enable new users to sign up" so only admin-added users can authenticate
- **Authentication → URL Configuration** — set **Site URL** to your production URL; add `http://localhost:5173` to **Additional Redirect URLs** for local dev

Users sign in via the dashboard's `/login` page with email + password. Admins create accounts via **Authentication → Users → Add user** (with a temporary password they can share with the user).

### 3. Run `schema.sql`

Open **SQL Editor** in the Supabase Dashboard → **New query** → paste the contents of `schema.sql` → **Run**

Or via `psql`:

```bash
psql "postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" -f supabase/schema.sql
```

`schema.sql` starts with `drop table ... cascade` plus a `drop function` / `drop type` block, so it is re-runnable — the data will be wiped and re-seeded. **Take a backup first if you have production data.**

This single script now also:

- Creates the `ptc_user_role` enum and `ptc_profiles` table
- Installs a BEFORE INSERT/UPDATE trigger on `ptc_action_progress` that auto-fills `last_updated = now()` and `updated_by = auth.jwt() ->> 'email'`
- Installs an AFTER INSERT trigger on `auth.users` that auto-creates a `ptc_profiles` row (first user = `admin`, others = `editor`)
- Creates the `ptc_v_action_progress_with_author` view

### 4. Run `rls.sql`

Open **SQL Editor** → **New query** → paste the contents of `rls.sql` → **Run**

The file cleans up old policies and helper functions first, then recreates them (also re-runnable). This script:

- Enables RLS on all `ptc_*` tables
- Drops the legacy anon-write policies
- Installs role-helper functions (`current_user_role`, `is_admin`, `is_editor_or_above`) that read `ptc_profiles` via `SECURITY DEFINER` so the policies don't recurse
- Grants **SELECT** to `anon` and `authenticated` on every public table
- Grants **INSERT/UPDATE on runtime tables** to `editor` and `admin`; **DELETE** to `admin` only
- Grants **full CRUD on master/config tables** to `admin` only
- Allows users to update their own profile's `display_name` (but not their own role) and admins to manage all profiles

### 5. Verify

In the SQL Editor:

```sql
-- Count rows in each table
select 'ptc_recommendations' as t, count(*) from ptc_recommendations
union all select 'ptc_actions',         count(*) from ptc_actions
union all select 'ptc_action_progress', count(*) from ptc_action_progress
union all select 'ptc_status_catalog',  count(*) from ptc_status_catalog
union all select 'ptc_fiscal_months',   count(*) from ptc_fiscal_months
union all select 'ptc_user',             count(*) from ptc_user;

-- Inspect RLS policies
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Confirm the audit trigger exists
select tgname, tgrelid::regclass
from pg_trigger
where tgname in ('trg_ptc_action_progress_audit', 'trg_on_auth_user_created', 'trg_ptc_user_set_updated_at');

-- Smoke test the views
select id, rec_no, plan, status, progress_pct
from ptc_v_actions_full
order by rec_no, action_no;
```

Expected row counts after a fresh `schema.sql` run:

| Table | Row count |
|---|---|
| ptc_recommendations | 3 |
| ptc_actions | 12 |
| ptc_action_progress | 12 |
| ptc_status_catalog | 5 |
| ptc_fiscal_months | 12 |
| ptc_user | 0 (populated when admin adds users via Supabase Auth) |

### 6. First sign-in (bootstrap)

1. In **Supabase Dashboard → Authentication → Users → Add user**, create the first user with the email of the person who will be the admin. Choose **Auto Confirm User** = ON so they can sign in immediately. Note the temporary password.
2. Open the dashboard at your Site URL. You are redirected to `/login`.
3. Sign in with the admin's email + the temporary password. The `handle_new_user` trigger creates the `ptc_user` row automatically with `role = 'admin'` (because they're the first user).
4. **Change your password** (in **Authentication → Users → … → Update password** in the dashboard, or in the dashboard's **/admin/users → จัดการผู้ใช้** page once we add that flow).

To add more team members:

1. **Authentication → Users → Add user** (email + password, auto-confirm ON)
2. Sign in as admin → go to **/admin/users** → assign a role
3. Tell the new user their temporary password (they can change it in their own profile flow)

## Access model

| Role | SELECT | INSERT / UPDATE | DELETE |
|---|---|---|---|
| `anon` (public, no login) | All tables | — | — |
| `viewer` (authenticated) | All tables | — | — |
| `editor` (authenticated) | All tables | Runtime: `ptc_action_progress`, `ptc_meetings`, `ptc_agendas` | — |
| `admin` (authenticated) | All tables | All tables (including master/config + profiles) | All tables |
| `service_role` (backend only) | All tables | All tables (bypasses RLS) | All tables |

The audit columns `last_updated` and `updated_by` on `ptc_action_progress` are written by a `SECURITY DEFINER` trigger that pulls identity from `auth.jwt()` — clients cannot spoof the author of an update.

## Realtime (live multi-user sync)

`schema.sql` automatically adds `ptc_action_progress` to the `supabase_realtime` publication on first run (the free tier includes 2M messages/month and 200 concurrent connections).

To enable additional tables (or re-enable manually), there are two options:

**Option A — SQL (recommended):**

```sql
alter publication supabase_realtime add table public.ptc_action_progress;
```

**Option B — Dashboard UI:**

Database → Publications → select `supabase_realtime` → tick the tables you want.

> ⚠️ **Do not confuse this with** Database → Replication
> The Replication menu in the Dashboard is **External Replication** (Supabase ETL, private alpha + Pro plan).
> Realtime uses a different menu.

Verify the current state:

```sql
select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
```

## Sample queries used by the frontend

```sql
-- Load the dashboard (all 12 actions with progress + recommendation info)
select * from ptc_v_actions_full order by rec_no, action_no;

-- Only blocked / delayed items
select id, plan, status, progress_pct, blockers
from ptc_v_actions_full
where status in ('blocked', 'delayed');

-- Count by status
select status, count(*)
from ptc_action_progress
group by status;

-- Status configuration (labels + colors)
select * from ptc_status_catalog order by sort_order;

-- Fiscal month configuration
select * from ptc_fiscal_months order by month_no;

-- Audit trail: who updated what, when
select action_id, updated_by, last_updated, status, progress_pct
from ptc_v_action_progress_with_author
order by last_updated desc;
```

## Adding actions / editing the plan

Editing master data (e.g. adding a new action, changing a KPI, renaming a recommendation) requires the `admin` role. Sign in as an admin, then either:

- Use the Supabase Dashboard **Table Editor** (faster for one-off edits)
- Or run SQL in the SQL Editor:

```sql
-- Add progress for a new action (must insert into both actions and action_progress)
insert into ptc_actions (id, rec_no, action_no, plan, timeline, start_month, end_month, target, report_cycle, ha_ref)
values ('R1A5', 1, 5, 'New plan', 'Oct 68 – Mar 69', 1, 6, '100%', 'PTC report', 'II-6.1 New');

insert into ptc_action_progress (action_id) values ('R1A5');

-- Update an action status (also possible as editor through the dashboard UI)
update ptc_action_progress
set status = 'in_progress', progress_pct = 50
where action_id = 'R1A1';
-- last_updated + updated_by are filled in by the audit trigger; do not set them by hand.
```

## Migration from the legacy Google Sheets backend

Once the frontend is switched to Supabase, the legacy `src/gas/Code.gs` and `src/services/gas-api.ts` files are replaced by the Supabase JS client. The old Google Sheet can be archived as a backup. Note that any runtime data previously recorded (e.g. progress) will be lost — actions start fresh from the default `not_started` / 0%.
