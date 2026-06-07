# Supabase — PTC Monitor Dashboard

ไฟล์ SQL สำหรับ bootstrap และตั้งค่า Supabase project ให้รองรับ PTC Dashboard

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | คำอธิบาย | รันเมื่อ |
|---|---|---|
| `schema.sql` | DDL สร้าง tables/views/indexes/triggers + seed data | ครั้งเดียวตอนติดตั้งครั้งแรก (re-runnable) |
| `rls.sql` | Row Level Security policies | หลัง `schema.sql` (re-runnable) |

## โครงสร้างตาราง

ตารางทั้งหมดใช้ prefix `ptc_` เพื่อแยกออกจาก object อื่นใน project

### Master / config (read-only สำหรับ anon)

- **`ptc_recommendations`** (3 rows) — ข้อเสนอแนะ R1/R2/R3 (title, short_title, color_key, hex_color)
- **`ptc_actions`** (12 rows) — แผนงาน R1A1..R3A4 (plan, sub_items[], timeline, kpis[], target, owners[], report_cycle, ha_ref)
- **`ptc_status_catalog`** (5 rows) — config สถานะ (label, tailwind classes, hex)
- **`ptc_fiscal_months`** (12 rows) — เดือนงบประมาณ (month_no 1–12 → Thai label + calendar_month)

### Runtime (anon เขียนได้)

- **`ptc_action_progress`** (12 rows, 1:1 กับ actions) — สถานะ runtime (status, progress_pct, actual_value, notes, blockers, last_updated, updated_by)
- **`ptc_meetings`** — การประชุม PTC (meeting_date, title, status, report_url)
- **`ptc_agendas`** — วาระการประชุม (FK → ptc_meetings)

### View

- **`ptc_v_actions_full`** — join actions + progress + recommendations สำหรับ query ครั้งเดียว

## ขั้นตอนการติดตั้ง

### 1. สร้าง Supabase project

1. ไปที่ [supabase.com](https://supabase.com/) → New project
2. เลือก region ใกล้ผู้ใช้ (เช่น Singapore)
3. ตั้ง database password แล้วจดไว้

### 2. รัน schema

เปิด **SQL Editor** ใน Supabase Dashboard → New query → paste เนื้อหา `schema.sql` → Run

หรือใช้ `psql`:

```bash
psql "postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" -f supabase/schema.sql
```

ไฟล์ `schema.sql` มี `drop table ... cascade` อยู่บนสุด รันซ้ำได้ — ข้อมูลจะถูกล้างและ seed ใหม่ทั้งหมด

### 3. รัน RLS

เปิด **SQL Editor** → New query → paste เนื้อหา `rls.sql` → Run

ไฟล์จะ cleanup policy เก่าก่อน แล้วสร้างใหม่ (re-runnable เช่นกัน)

### 4. ตรวจสอบ

ใน SQL Editor:

```sql
-- นับจำนวน row ในแต่ละตาราง
select 'ptc_recommendations' as t, count(*) from ptc_recommendations
union all select 'ptc_actions',         count(*) from ptc_actions
union all select 'ptc_action_progress', count(*) from ptc_action_progress
union all select 'ptc_status_catalog',  count(*) from ptc_status_catalog
union all select 'ptc_fiscal_months',   count(*) from ptc_fiscal_months;

-- ดู RLS policies
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- ทดสอบ view
select id, rec_no, plan, status, progress_pct
from ptc_v_actions_full
order by rec_no, action_no;
```

ผลที่คาดหวัง:

| ตาราง | row count |
|---|---|
| ptc_recommendations | 3 |
| ptc_actions | 12 |
| ptc_action_progress | 12 |
| ptc_status_catalog | 5 |
| ptc_fiscal_months | 12 |

## Access Model

| Role | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `anon` (public) | ทุกตาราง | เฉพาะ runtime: `ptc_action_progress`, `ptc_meetings`, `ptc_agendas` |
| `authenticated` (login) | ทุกตาราง | ทุกตาราง (รวม master/config) |
| `service_role` (backend) | ทุกตาราง | ทุกตาราง (bypass RLS) |

โมเดลนี้ตรงกับของเดิมที่ใช้ Google Apps Script (public read + public write runtime) แต่ป้องกันไม่ให้ anon แก้ไข master data เช่น เปลี่ยนชื่อข้อเสนอแนะ หรือแก้ไข config สถานะ

## ตัวอย่าง query ที่ frontend จะใช้

```sql
-- ดึงข้อมูล dashboard (ทั้ง 12 actions พร้อม progress + rec info)
select * from ptc_v_actions_full order by rec_no, action_no;

-- ดึงเฉพาะที่ติดขัด/ล่าช้า
select id, plan, status, progress_pct, blockers
from ptc_v_actions_full
where status in ('blocked', 'delayed');

-- สรุปจำนวนตามสถานะ
select status, count(*)
from ptc_action_progress
group by status;

-- ดึง config สถานะ (label/สี)
select * from ptc_status_catalog order by sort_order;

-- ดึง config เดือนงบประมาณ
select * from ptc_fiscal_months order by month_no;
```

## เพิ่ม action / เปลี่ยนแผน

ถ้าต้องการเพิ่ม action ใหม่ หรือเปลี่ยนแผนเดิม ให้แก้ที่ table โดยตรง (ต้อง login เป็น `authenticated`):

```sql
-- เพิ่ม progress ให้ action ใหม่ (ต้อง insert ทั้งใน actions และ action_progress)
insert into ptc_actions (id, rec_no, action_no, plan, timeline, start_month, end_month, target, report_cycle, ha_ref)
values ('R1A5', 1, 5, 'แผนใหม่', 'ต.ค. 68 – มี.ค. 69', 1, 6, '100%', 'รายงาน PTC', 'II-6.1 New');

insert into ptc_action_progress (action_id) values ('R1A5');

-- อัปเดตสถานะ action (anon เขียนได้)
update ptc_action_progress
set status = 'in_progress', progress_pct = 50, last_updated = now(), updated_by = 'PTC'
where action_id = 'R1A1';
```

## Migration จาก Google Sheets ของเดิม

เมื่อ frontend เปลี่ยนมาใช้ Supabase แล้ว ไฟล์ `src/gas/Code.gs` และ `src/services/gas-api.ts` จะถูกแทนที่ด้วย Supabase JS client ส่วน Google Sheet เดิมสามารถ archive ไว้เป็น backup ได้ (ข้อมูล runtime เช่น progress ที่บันทึกไว้จะหายไป — เริ่มต้นใหม่จาก default `not_started`, 0%)
