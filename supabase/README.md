# Supabase — PTC Monitor Dashboard

SQL files for bootstrapping and configuring a Supabase project to support the PTC Dashboard.

## Files in this folder

| File | Description | When to run |
|---|---|---|
| `schema.sql` | DDL: tables / views / indexes / triggers + seed data | Once at first install (re-runnable) |
| `rls.sql` | Row Level Security policies | After `schema.sql` (re-runnable) |

## Schema overview

All tables use the `ptc_` prefix to keep them isolated from other objects in the project.

### Master / config (read-only for `anon`)

- **`ptc_recommendations`** (3 rows) — recommendations R1/R2/R3 (title, short_title, color_key, hex_color)
- **`ptc_actions`** (12 rows) — action plans R1A1..R3A4 (plan, sub_items[], timeline, kpis[], target, owners[], report_cycle, ha_ref)
- **`ptc_status_catalog`** (5 rows) — status configuration (label, tailwind classes, hex)
- **`ptc_fiscal_months`** (12 rows) — fiscal year months (month_no 1–12 → Thai label + calendar_month)

### Runtime (`anon` can write)

- **`ptc_action_progress`** (12 rows, 1:1 with `ptc_actions`) — runtime status (status, progress_pct, actual_value, notes, blockers, last_updated, updated_by)
- **`ptc_meetings`** — PTC meetings (meeting_date, title, status, report_url)
- **`ptc_agendas`** — meeting agenda items (FK → `ptc_meetings`)

### View

- **`ptc_v_actions_full`** — join of actions + progress + recommendations, fetched in a single query

## Installation

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) → **New project**
2. Choose a region close to your users (e.g. Singapore)
3. Set a database password and save it securely

### 2. Run `schema.sql`

Open **SQL Editor** in the Supabase Dashboard → **New query** → paste the contents of `schema.sql` → **Run**

Or via `psql`:

```bash
psql "postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" -f supabase/schema.sql
```

`schema.sql` starts with `drop table ... cascade`, so it is re-runnable — the data will be wiped and re-seeded.

### 3. Run `rls.sql`

Open **SQL Editor** → **New query** → paste the contents of `rls.sql` → **Run**

The file cleans up old policies first, then recreates them (also re-runnable).

### 4. Verify

In the SQL Editor:

```sql
-- Count rows in each table
select 'ptc_recommendations' as t, count(*) from ptc_recommendations
union all select 'ptc_actions',         count(*) from ptc_actions
union all select 'ptc_action_progress', count(*) from ptc_action_progress
union all select 'ptc_status_catalog',  count(*) from ptc_status_catalog
union all select 'ptc_fiscal_months',   count(*) from ptc_fiscal_months;

-- Inspect RLS policies
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Smoke test the view
select id, rec_no, plan, status, progress_pct
from ptc_v_actions_full
order by rec_no, action_no;
```

Expected row counts:

| Table | Row count |
|---|---|
| ptc_recommendations | 3 |
| ptc_actions | 12 |
| ptc_action_progress | 12 |
| ptc_status_catalog | 5 |
| ptc_fiscal_months | 12 |

## Access model

| Role | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `anon` (public) | All tables | Runtime only: `ptc_action_progress`, `ptc_meetings`, `ptc_agendas` |
| `authenticated` (login) | All tables | All tables (including master/config) |
| `service_role` (backend) | All tables | All tables (bypasses RLS) |

This mirrors the legacy Google Apps Script model (public read + public write on runtime) while preventing `anon` from modifying master data — for example, renaming a recommendation or editing status configuration.

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
```

## Adding actions / editing the plan

To add a new action or modify an existing plan, edit the tables directly (requires logging in as `authenticated`):

```sql
-- Add progress for a new action (must insert into both actions and action_progress)
insert into ptc_actions (id, rec_no, action_no, plan, timeline, start_month, end_month, target, report_cycle, ha_ref)
values ('R1A5', 1, 5, 'New plan', 'Oct 68 – Mar 69', 1, 6, '100%', 'PTC report', 'II-6.1 New');

insert into ptc_action_progress (action_id) values ('R1A5');

-- Update an action status (anon can write this)
update ptc_action_progress
set status = 'in_progress', progress_pct = 50, last_updated = now(), updated_by = 'PTC'
where action_id = 'R1A1';
```

## Migration from the legacy Google Sheets backend

Once the frontend is switched to Supabase, the legacy `src/gas/Code.gs` and `src/services/gas-api.ts` files are replaced by the Supabase JS client. The old Google Sheet can be archived as a backup. Note that any runtime data previously recorded (e.g. progress) will be lost — actions start fresh from the default `not_started` / 0%.
