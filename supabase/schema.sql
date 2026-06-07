-- ============================================================
-- supabase/schema.sql
-- PTC Monitor Dashboard — initial schema + seed data
--
-- Run this once in Supabase SQL Editor to bootstrap the project.
-- Re-runnable: drops existing objects before recreating.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. Cleanup (safe re-run)
-- ─────────────────────────────────────────────────────────────
drop table if exists public.ptc_agendas cascade;
drop table if exists public.ptc_meetings cascade;
drop table if exists public.ptc_action_progress cascade;
drop table if exists public.ptc_actions cascade;
drop table if exists public.ptc_recommendations cascade;
drop table if exists public.ptc_status_catalog cascade;
drop table if exists public.ptc_fiscal_months cascade;
drop table if exists public.ptc_profiles cascade;

drop function if exists public.set_updated_at() cascade;
drop function if exists public.set_action_progress_audit() cascade;
drop function if exists public.handle_new_user() cascade;
drop type  if exists public.ptc_user_role cascade;


-- ─────────────────────────────────────────────────────────────
-- 1. Extensions
-- ─────────────────────────────────────────────────────────────
-- pgcrypto is bundled in Supabase; gen_random_uuid() lives there.
create extension if not exists "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- 2. Tables
-- ─────────────────────────────────────────────────────────────

-- 2.1 Recommendations (master: R1, R2, R3)
create table public.ptc_recommendations (
  no          smallint primary key check (no between 1 and 9),
  title       text    not null,
  short_title text    not null,
  color_key   text    not null,        -- tailwind semantic name, e.g. 'red', 'emerald', 'amber'
  hex_color   text    not null,        -- hex used in inline styles, e.g. '#dc3545'
  created_at  timestamptz not null default now()
);
comment on table public.ptc_recommendations is
  'Master list of 3 PTC quality-improvement recommendations (R1/R2/R3).';


-- 2.2 Actions (master: 12 plan items, R1A1..R3A4)
create table public.ptc_actions (
  id           text     primary key,                    -- 'R1A1', 'R1A2', ...
  rec_no       smallint not null references public.ptc_recommendations(no) on delete cascade,
  action_no    smallint not null check (action_no between 1 and 99),
  plan         text     not null,
  sub_items    text[]   not null default '{}',
  timeline     text     not null,                       -- display string, e.g. 'มี.ค. – เม.ย. 68'
  start_month  smallint not null check (start_month between 1 and 12),  -- fiscal year (1=ต.ค.)
  end_month    smallint not null check (end_month   between 1 and 12),
  kpis         text[]   not null default '{}',
  target       text     not null,
  owners       text[]   not null default '{}',
  report_cycle text     not null,
  ha_ref       text     not null,                       -- HA II-6 reference
  created_at   timestamptz not null default now(),
  constraint chk_actions_month_range check (start_month <= end_month),
  unique (rec_no, action_no)
);
comment on table public.ptc_actions is
  'Master definition of 12 quality-improvement action items under each recommendation.';


-- 2.3 Action progress (runtime state, 1:1 with actions)
create table public.ptc_action_progress (
  action_id     text primary key references public.ptc_actions(id) on delete cascade,
  status        text     not null default 'not_started'
                            check (status in ('not_started','in_progress','completed','delayed','blocked')),
  progress_pct  smallint not null default 0
                            check (progress_pct between 0 and 100),
  actual_value  text     not null default '',
  notes         text     not null default '',
  blockers      text     not null default '',
  last_updated  timestamptz,
  updated_by    text     not null default 'system'
);
comment on table public.ptc_action_progress is
  'Runtime state of each action item (status, progress, notes, blockers, audit fields).';
comment on column public.ptc_action_progress.status is
  'Action lifecycle status. See public.ptc_status_catalog for label/colors.';
comment on column public.ptc_action_progress.last_updated is
  'Auto-populated by trigger on UPDATE (auth.uid() / auth.jwt()).';
comment on column public.ptc_action_progress.updated_by is
  'Email of authenticated user who last updated the row. Auto-populated by trigger.';


-- 2.4 Meetings (Smart PTC)
create table public.ptc_meetings (
  id           text primary key,
  meeting_date date      not null,
  title        text      not null,
  status       text      not null default 'scheduled'
                            check (status in ('scheduled','active','completed')),
  report_url   text      not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.ptc_meetings is
  'PTC team meetings. status lifecycle: scheduled → active → completed.';


-- 2.5 Agendas (Smart PTC, belongs to a meeting)
create table public.ptc_agendas (
  id          text primary key,
  meeting_id  text      not null references public.ptc_meetings(id) on delete cascade,
  title       text      not null,
  proposer    text      not null default '',
  description text      not null default '',
  resolution  text      not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.ptc_agendas is
  'Agenda items proposed at each PTC meeting.';


-- 2.6 Status catalog (config: drives UI labels/colors)
create table public.ptc_status_catalog (
  status_key    text primary key,                        -- 'not_started', 'in_progress', ...
  label         text not null,                            -- Thai label, e.g. 'ยังไม่เริ่ม'
  color_class   text not null,                            -- tailwind text class
  bg_class      text not null,                            -- tailwind bg class
  dot_class     text not null,                            -- tailwind bg class for the dot
  border_class  text not null,                            -- tailwind border class
  hex_color     text not null,                            -- hex for inline use
  sort_order    smallint not null default 0
);
comment on table public.ptc_status_catalog is
  'Status configuration (label, tailwind classes, hex) used by the dashboard UI.';


-- 2.7 Fiscal months (config: maps fiscal 1–12 to Thai short labels)
create table public.ptc_fiscal_months (
  month_no        smallint primary key check (month_no between 1 and 12),
  short_label     text not null,                          -- 'ต.ค.', 'พ.ย.', ...
  calendar_month  smallint not null check (calendar_month between 1 and 12)
);
comment on table public.ptc_fiscal_months is
  'Thai fiscal year month labels. month_no=1 corresponds to October.';


-- 2.8 User role enum (for ptc_profiles.role)
create type public.ptc_user_role as enum ('viewer', 'editor', 'admin');


-- 2.9 User profiles (1:1 with auth.users)
--     Created automatically on first sign-in via auth.users trigger.
--     The first user to sign in becomes 'admin' so the system bootstraps
--     without manual SQL. Subsequent users default to 'editor'.
create table public.ptc_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text    not null,
  display_name  text    not null default '',
  role          public.ptc_user_role not null default 'editor',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.ptc_profiles is
  'Application-level user profile. 1:1 with auth.users. Drives role-based authorization and display_name for audit trails.';
comment on column public.ptc_profiles.role is
  'Application role: viewer (read-only), editor (read+write runtime), admin (full CRUD including master/config).';
comment on column public.ptc_profiles.display_name is
  'Optional human-readable name shown in audit columns and header. Falls back to email when empty.';


-- ─────────────────────────────────────────────────────────────
-- 3. Indexes
-- ─────────────────────────────────────────────────────────────
create index idx_ptc_actions_rec_no        on public.ptc_actions        (rec_no, action_no);
create index idx_ptc_action_progress_status on public.ptc_action_progress (status);
create index idx_ptc_meetings_date         on public.ptc_meetings       (meeting_date desc);
create index idx_ptc_meetings_status       on public.ptc_meetings       (status);
create index idx_ptc_agendas_meeting       on public.ptc_agendas        (meeting_id, updated_at desc);


-- ─────────────────────────────────────────────────────────────
-- 4. Triggers — auto-update audit fields on row UPDATE
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_ptc_meetings_set_updated_at
  before update on public.ptc_meetings
  for each row execute function public.set_updated_at();

create trigger trg_ptc_agendas_set_updated_at
  before update on public.ptc_agendas
  for each row execute function public.set_updated_at();

create trigger trg_ptc_profiles_set_updated_at
  before update on public.ptc_profiles
  for each row execute function public.set_updated_at();


-- 4.1 Action progress audit — auto-fill last_updated + updated_by
--     Pulls identity from auth.jwt() so callers cannot spoof the audit trail.
--     Bypassed for the postgres / service_role context (SQL Editor, migrations,
--     edge functions) so seeds and admin scripts can write without a JWT — the
--     column defaults ('system' for updated_by, NULL for last_updated) fill in.
create or replace function public.set_action_progress_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_email text;
  jwt_role  text;
begin
  jwt_role := auth.role();
  -- Trusted write contexts: leave the row unchanged so column defaults win.
  --   * NULL role  → postgres / SQL Editor (no Supabase JWT in session)
  --   * 'service_role' → server-side admin (migrations, edge functions)
  if jwt_role is null or jwt_role = 'service_role' then
    return new;
  end if;

  -- For 'anon' and 'authenticated' writers, require a real identity.
  jwt_email := auth.jwt() ->> 'email';
  if jwt_email is null or jwt_email = '' then
    raise exception 'ptc_action_progress: writer must be authenticated (auth.jwt().email is empty)';
  end if;
  new.last_updated := now();
  new.updated_by   := jwt_email;
  return new;
end;
$$;

create trigger trg_ptc_action_progress_audit
  before insert or update on public.ptc_action_progress
  for each row execute function public.set_action_progress_audit();


-- 4.2 Bootstrap — create a profile row when a new auth.users row appears.
--     First-ever user becomes 'admin' so the system bootstraps without
--     manual SQL. Later users default to 'editor'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.ptc_profiles;
  insert into public.ptc_profiles (user_id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when user_count = 0 then 'admin'::public.ptc_user_role
         else 'editor'::public.ptc_user_role
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 5. View — flattened action + progress + recommendation
-- ─────────────────────────────────────────────────────────────
create or replace view public.ptc_v_actions_full as
select
  a.id,
  a.rec_no,
  a.action_no,
  a.plan,
  a.sub_items,
  a.timeline,
  a.start_month,
  a.end_month,
  a.kpis,
  a.target,
  a.owners,
  a.report_cycle,
  a.ha_ref,
  p.status,
  p.progress_pct,
  p.actual_value,
  p.notes,
  p.blockers,
  p.last_updated,
  p.updated_by,
  r.title          as rec_title,
  r.short_title    as rec_short_title,
  r.color_key      as rec_color_key,
  r.hex_color      as rec_hex_color
from public.ptc_actions a
left join public.ptc_action_progress p on p.action_id = a.id
join public.ptc_recommendations r      on r.no        = a.rec_no;
comment on view public.ptc_v_actions_full is
  'Flattened view for the dashboard: action definition + runtime state + parent recommendation.';


-- ═════════════════════════════════════════════════════════════
-- 6. Seed data
-- ═════════════════════════════════════════════════════════════

-- 6.1 Recommendations (3 rows)
insert into public.ptc_recommendations (no, title, short_title, color_key, hex_color) values
  (1,
   'ส่งเสริมให้ Medication Safety Team มีบทบาทชัดเจนในการออกแบบระบบเชิงป้องกัน ME และจัดทำ QI Plan แบบเชิงรุก',
   'Safety Team & QI Plan',
   'red',
   '#dc3545'),
  (2,
   'ติดตามการปฏิบัติตามแนวทาง HAD, ADR, Medication Reconciliation, DUE และมาตรฐานวิชาชีพเภสัชกรรม',
   'HAD / Med Rec / DUE / ADR',
   'emerald',
   '#215732'),
  (3,
   'ทบทวนการสำรองยาฉุกเฉิน ยาเสพติด และระบบการจ่ายยานอกเวลาราชการ ให้ตรงตามมาตรฐาน',
   'Emergency Stock & After-hour',
   'amber',
   '#b45309');


-- 6.2 Actions (12 rows)
insert into public.ptc_actions
  (id, rec_no, action_no, plan, sub_items, timeline, start_month, end_month, kpis, target, owners, report_cycle, ha_ref) values
  ('R1A1', 1, 1,
   'จัดตั้ง/ทบทวนบทบาท Medication Safety Team',
   array['กำหนด TOR ทีมความปลอดภัยด้านยา','ประชุมทีมอย่างน้อยไตรมาสละ 1 ครั้ง'],
   'มี.ค. – เม.ย. 68', 6, 7,
   array['มี TOR เป็นลายลักษณ์อักษร','ประชุมทีม ≥ 4 ครั้ง/ปี'],
   '100%',
   array['ภก.สุรเดช ประถมศักดิ์'],
   'ทุกไตรมาส / รายงาน PTC',
   'II-6.1 Governance'),

  ('R1A2', 1, 2,
   'จัดทำ QI Plan ด้านระบบยา',
   array[
     'วิเคราะห์ root cause จากอุบัติการณ์ที่ผ่านมา',
     'กำหนดประเด็น QI ≥ 1 เรื่อง/ปี',
     'ติดตามผลลัพธ์ตาม PDCA'
   ],
   'เม.ย. – ก.ย. 68', 7, 12,
   array['มี QI Plan เป็นลายลักษณ์อักษร','ครอบคลุม ≥ 1 ประเด็นจาก incident'],
   'มี QI Plan ≥ 1 เรื่อง',
   array['เภสัชกรรับผิดชอบระบบยา','PTC'],
   'ทุก 6 เดือน / รายงาน HA',
   'II-6.1 Oversight'),

  ('R1A3', 1, 3,
   'พัฒนาระบบรายงานและวิเคราะห์ ME เชิงรุก',
   array[
     'ทบทวน ME ทุกประเภทรายเดือน',
     'ใช้ RCA/FMEA สำหรับ incident ระดับ E ขึ้นไป',
     'ออกแบบ barrier ป้องกัน unsafe act'
   ],
   'ต.ค. 67 – ก.ย. 68 (ตลอดปี)', 1, 12,
   array['ร้อยละของ ME ที่ได้รับการวิเคราะห์หาสาเหตุ','จำนวน barrier ที่พัฒนาใหม่'],
   'วิเคราะห์ 100% ของ incident ≥ E',
   array['เภสัชกรทุกคน','หัวหน้าหอผู้ป่วย'],
   'รายเดือน (เสนอ PTC ทุกไตรมาส)',
   'II-6.1 ME Prevention'),

  ('R1A4', 1, 4,
   'ทบทวนมาตรฐานวิชาชีพเภสัชกรรม',
   array[
     'จัดกิจกรรม Pharmacy Professional Standard Review ปีละ 1 ครั้ง',
     'อ้างอิงมาตรฐาน HA ฉบับที่ 5 มาตรฐาน II-6',
     'บันทึกผลการทบทวนและแผนปรับปรุง'
   ],
   'มิ.ย. – ก.ย. 68', 9, 12,
   array['มีรายงานการทบทวน','มีแผนปรับปรุงอย่างน้อย 1 ประเด็น'],
   '100% ดำเนินการ',
   array['ภก.สุรเดช ประถมศักดิ์'],
   'ปีละ 1 ครั้ง / รายงาน PTC',
   'II-6.1 Standards'),

  ('R2A1', 2, 1,
   'ทบทวนและปรับ HAD Policy ให้ครบถ้วน',
   array[
     'ทบทวนรายการ HAD ตามแนวทาง ISMP',
     'กำหนดมาตรการ double checking สำหรับ HAD',
     'ตรวจสอบ double lock, label สีส้ม, และสถานที่จัดเก็บ'
   ],
   'เม.ย. – มิ.ย. 68', 7, 9,
   array['ร้อยละ HAD ที่มี double checking ≥ 95%','ผ่านการตรวจสอบตาม checklist'],
   '≥ 95%',
   array['ภก.สุรเดช ประถมศักดิ์','หัวหน้าหอผู้ป่วย'],
   'ทุกไตรมาส / PTC',
   'II-6.2 HAD'),

  ('R2A2', 2, 2,
   'พัฒนาระบบ Medication Reconciliation ผู้ป่วยใน',
   array[
     'กำหนดขั้นตอน Med Rec (Admission, Transfer, Discharge)',
     'พัฒนาแบบฟอร์ม Med Rec ในระบบ HosXP',
     'อบรมพยาบาลและแพทย์เรื่อง Med Rec'
   ],
   'เม.ย. – ส.ค. 68', 7, 11,
   array['ความสมบูรณ์ของ Med Rec ≥ 80%'],
   '≥ 80%',
   array['เภสัชกร','หัวหน้าหอผู้ป่วย','แพทย์'],
   'ทุกเดือน (รายงาน PTC ทุกไตรมาส)',
   'II-6.2 Med Rec'),

  ('R2A3', 2, 3,
   'ดำเนินการ DUE (Drug Use Evaluation)',
   array[
     'คัดเลือกยาเป้าหมาย DUE อย่างน้อย 1 รายการ/ปี',
     'กำหนด criteria และเก็บข้อมูล',
     'นำเสนอผล DUE ต่อ PTC พร้อมข้อเสนอแนะ'
   ],
   'มิ.ย. – ก.ย. 68', 9, 12,
   array['มีรายงาน DUE ≥ 1 เรื่อง/ปี'],
   '≥ 1 เรื่อง/ปี',
   array['เภสัชกร','PTC'],
   'ปีละ 1 ครั้ง / เสนอ PTC',
   'II-6.2 DUE'),

  ('R2A4', 2, 4,
   'เฝ้าระวัง ADR Type A และทบทวนใบสั่งยา',
   array[
     'กำหนดเกณฑ์ ADR Type A ที่ควรเฝ้าระวัง',
     'ทบทวนคำสั่งใช้ยาจากใบสั่งยา (Drug Order Review) รายสัปดาห์',
     'รายงาน ADR เข้า NRLS ทุกราย'
   ],
   'ต.ค. 67 – ก.ย. 68 (ตลอดปี)', 1, 12,
   array['ADR ซ้ำ = 0 ราย','ร้อยละใบสั่งยาที่ได้รับการทบทวน'],
   'ADR ซ้ำ = 0 / Drug review ≥ 80%',
   array['เภสัชกรทุกคน'],
   'รายเดือน / รายงาน PTC ทุกไตรมาส',
   'II-6.2 ADR'),

  ('R3A1', 3, 1,
   'ทบทวนและปรับปรุงระบบยาสำรองฉุกเฉิน',
   array[
     'สำรวจรายการยาสำรองฉุกเฉินที่จุดบริการทุกแห่ง',
     'ทบทวนให้ตรงตามมาตรฐาน HA II-6 และนโยบาย รพ.',
     'จัดทำ checklist ตรวจสอบยาสำรองฉุกเฉิน'
   ],
   'เม.ย. – มิ.ย. 68', 7, 9,
   array['ร้อยละของจุดบริการที่ผ่าน checklist'],
   '≥ 95%',
   array['เภสัชกร','หัวหน้าหอผู้ป่วย'],
   'ทุก 3 เดือน / เสนอ PTC',
   'II-6.2 Storage'),

  ('R3A2', 3, 2,
   'ทบทวนระบบยาเสพติดและยาควบคุมพิเศษ',
   array[
     'ตรวจสอบสต็อก/ทะเบียนยาเสพติดให้ครบถ้วนตามกฎหมาย',
     'ทบทวนขั้นตอนการเบิกจ่ายและส่งคืนยาเสพติด'
   ],
   'เม.ย. – พ.ค. 68', 7, 8,
   array['ผ่านการตรวจสอบโดยไม่มีข้อบกพร่อง'],
   'ไม่มีข้อบกพร่อง',
   array['ภก.สุรเดช ประถมศักดิ์'],
   'ทุก 6 เดือน / รายงาน RM',
   'II-6.2 Narcotic'),

  ('R3A3', 3, 3,
   'กำหนดแนวทางการจ่ายยานอกเวลา (After-hour Dispensing)',
   array[
     'ระบุรายการยาที่อนุญาตให้จ่ายนอกเวลา',
     'กำหนด double checking procedure สำหรับยาที่จ่ายนอกเวลา',
     'จัดอบรมพยาบาล ICU/เวรดึก'
   ],
   'พ.ค. – ก.ค. 68', 8, 10,
   array['มีนโยบาย After-hour dispensing เป็นลายลักษณ์อักษร','ร้อยละพยาบาลที่ผ่านการอบรม'],
   'มีนโยบาย + อบรม ≥ 80%',
   array['เภสัชกร','หัวหน้าหอผู้ป่วย','งานการพยาบาล'],
   'ทุก 6 เดือน / PTC',
   'II-6.2 Dispensing'),

  ('R3A4', 3, 4,
   'ตรวจสอบยาสำรองที่ห้องยาปิด (Ward Stock Audit)',
   array[
     'ทบทวนรายการ ward stock ให้เป็นปัจจุบัน',
     'ตรวจสอบการจัดเก็บ (HAD, ยาเย็น, ยาแสงแดด)',
     'บันทึกผลการตรวจสอบ'
   ],
   'ต.ค. 67 – ก.ย. 68 (ปีละ 2 ครั้ง)', 1, 12,
   array['ร้อยละ ward stock ที่ผ่านมาตรฐาน ≥ 90%'],
   '≥ 90%',
   array['เภสัชกร'],
   'ปีละ 2 ครั้ง (มี.ค., ก.ย.) / PTC',
   'II-6.2 Storage');


-- 6.3 Action progress (12 rows, one per action, default state)
--     Audit fields are explicitly set so the seed origin is clear regardless
--     of the trigger behavior (the trigger would write 'system' via the
--     column defaults, but spelling it out is more honest).
insert into public.ptc_action_progress (action_id, last_updated, updated_by) values
  ('R1A1', now(), 'system'),('R1A2', now(), 'system'),
  ('R1A3', now(), 'system'),('R1A4', now(), 'system'),
  ('R2A1', now(), 'system'),('R2A2', now(), 'system'),
  ('R2A3', now(), 'system'),('R2A4', now(), 'system'),
  ('R3A1', now(), 'system'),('R3A2', now(), 'system'),
  ('R3A3', now(), 'system'),('R3A4', now(), 'system');


-- 6.4 Status catalog (5 rows)
insert into public.ptc_status_catalog
  (status_key, label, color_class, bg_class, dot_class, border_class, hex_color, sort_order) values
  ('not_started', 'ยังไม่เริ่ม',       'text-stone-600', 'bg-stone-100', 'bg-stone-400', 'border-stone-300', '#a8ae80', 1),
  ('in_progress', 'กำลังดำเนินการ',  'text-blue-700',  'bg-blue-50',  'bg-blue-600',  'border-blue-300',  '#3a5a8c', 2),
  ('completed',   'เสร็จสิ้น',           'text-green-700', 'bg-green-50', 'bg-green-600', 'border-green-300', '#2e7028', 3),
  ('delayed',     'ล่าช้า',              'text-amber-700', 'bg-amber-50', 'bg-amber-600', 'border-amber-300', '#8c6010', 4),
  ('blocked',     'ติดขัด',              'text-red-700',   'bg-red-50',   'bg-red-700',   'border-red-300',   '#963020', 5);


-- 6.5 Fiscal months (12 rows: month_no 1 = ต.ค. = October)
insert into public.ptc_fiscal_months (month_no, short_label, calendar_month) values
  (1,  'ต.ค.', 10),
  (2,  'พ.ย.', 11),
  (3,  'ธ.ค.', 12),
  (4,  'ม.ค.',  1),
  (5,  'ก.พ.',  2),
  (6,  'มี.ค.',  3),
  (7,  'เม.ย.',  4),
  (8,  'พ.ค.',  5),
  (9,  'มิ.ย.',  6),
  (10, 'ก.ค.',  7),
  (11, 'ส.ค.',  8),
  (12, 'ก.ย.',  9);


-- ═════════════════════════════════════════════════════════════
-- 7. Realtime — add ptc_action_progress to supabase_realtime publication
--    so the dashboard can subscribe to live changes (Free tier supported:
--    2M messages + 200 concurrent connections included).
-- ═════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ptc_action_progress'
  ) then
    execute 'alter publication supabase_realtime add table public.ptc_action_progress';
  end if;
end $$;


-- ═════════════════════════════════════════════════════════════
-- 7b. View — flatten progress updates with author display name
-- ═════════════════════════════════════════════════════════════
create or replace view public.ptc_v_action_progress_with_author as
select
  p.*,
  pr.display_name as updated_by_display_name
from public.ptc_action_progress p
left join public.ptc_profiles pr on pr.email = p.updated_by;
comment on view public.ptc_v_action_progress_with_author is
  'ptc_action_progress joined to ptc_profiles so UI can render display_name from updated_by email.';


-- ═════════════════════════════════════════════════════════════
-- 8. Done
-- ═════════════════════════════════════════════════════════════
-- Verify row counts (optional):
--   select 'ptc_recommendations' as t, count(*) from ptc_recommendations
--   union all select 'ptc_actions',         count(*) from ptc_actions
--   union all select 'ptc_action_progress', count(*) from ptc_action_progress
--   union all select 'ptc_status_catalog',  count(*) from ptc_status_catalog
--   union all select 'ptc_fiscal_months',   count(*) from ptc_fiscal_months;
--
-- Verify Realtime publication (optional):
--   select pubname, schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime'
--   order by tablename;
