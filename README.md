# PTC Monitor Dashboard
### ระบบติดตามแผนพัฒนาคุณภาพยา · โรงพยาบาลสระโบสถ์ · HA II-6 · ปีงบ 2568

> **Tech stack:** Vue 3 + TypeScript · Tailwind CSS v4 · Pinia · Axios · Google Apps Script · Vercel

---

## ภาพรวมระบบ

Dashboard สำหรับทีม PTC ติดตามแผนพัฒนา 12 แผน จาก 3 ข้อเสนอแนะ HA Reaccreditation  
ข้อมูลความคืบหน้าเก็บใน **Google Sheets** (ผ่าน Apps Script API) และ deploy บน **Vercel**

```
Browser (Vue + TS)
    │  axios GET/POST
    ▼
Google Apps Script Web App (Code.gs)
    │  SpreadsheetApp
    ▼
Google Sheets — ActionProgress sheet
    [id | status | progressPct | actualValue | notes | blockers | lastUpdated | updatedBy]
```

---

## โครงสร้างโปรเจค

```
ptc-dashboard/
├── index.html
├── public/
│   └── favicon.svg
├── src/
│   ├── main.ts                   # Entry point
│   ├── App.vue                   # Root component + background effects
│   ├── assets/
│   │   └── main.css              # Tailwind v4 + design tokens + animations
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces ทั้งหมด
│   ├── data/
│   │   └── planData.ts           # แผนงาน 3 ข้อ (static) + STATUS_CONFIG
│   ├── composables/
│   │   └── useCountUp.ts         # Animated number counter
│   ├── services/
│   │   └── gasApi.ts             # Axios calls → GAS
│   ├── stores/
│   │   └── dashboard.ts          # Pinia store (state, sync, save)
│   ├── components/
│   │   ├── AppHeader.vue         # Header + clock + sync button + progress bar
│   │   ├── SummaryCards.vue      # KPI overview + circular progress + sparklines
│   │   ├── GanttChart.vue        # Fiscal year Gantt timeline
│   │   ├── SparklineChart.vue    # Mini SVG sparkline
│   │   ├── ActionCard.vue        # Card พร้อม inline status/progress edit
│   │   └── ActionDetailPanel.vue # Slide-in panel + บันทึก → GSheet
│   ├── views/
│   │   └── DashboardView.vue     # Main view (tabs, alert view, action grid)
│   └── gas/
│       └── Code.gs               # Google Apps Script backend
├── vercel.json
├── .env.example
└── .gitignore
```

---

## การติดตั้ง (Local Development)

### 1. Clone และ Install

```bash
git clone https://github.com/YOUR_ORG/ptc-dashboard.git
cd ptc-dashboard
npm install
```

### 2. ตั้งค่า Google Apps Script

#### 2.1 เปิด Google Sheet
- สร้าง Google Sheet ใหม่ (หรือใช้ที่มีอยู่) ใน Google Drive
- ตั้งชื่อ sheet ว่าอะไรก็ได้ (script จะสร้าง tab `ActionProgress` ให้เอง)

#### 2.2 เปิด Apps Script Editor
- เมนู **Extensions → Apps Script**
- ลบโค้ดเดิมทั้งหมดออก
- วางโค้ดจากไฟล์ `src/gas/Code.gs` ลงไป

#### 2.3 Deploy เป็น Web App
```
Deploy (ปุ่มบนขวา) → New deployment
  Type: Web app
  Description: PTC Dashboard API v1
  Execute as: Me (your email)
  Who has access: Anyone
→ Deploy
→ Copy the Web App URL
```

> **หมายเหตุ:** URL จะมีรูปแบบ  
> `https://script.google.com/macros/s/AKfycby.../exec`

#### 2.4 ทดสอบ API
เปิด URL นั้นใน browser — ควรเห็น JSON:
```json
{ "success": true, "data": [ { "id": "R1A1", "status": "not_started", ... } ] }
```

### 3. ตั้งค่า Environment Variable

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:
```env
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### 4. Run Development Server

```bash
npm run dev
# → http://localhost:5173
```

---

## Deploy บน Vercel

### วิธีที่ 1 — Vercel CLI
```bash
npm i -g vercel
vercel
# ตอบคำถาม: framework = Vite, output = dist
```

### วิธีที่ 2 — GitHub Integration (แนะนำ)
1. Push โค้ดขึ้น GitHub repository
2. เปิด [vercel.com](https://vercel.com) → New Project → Import repo
3. Framework Preset: **Vite**
4. ไปที่ **Settings → Environment Variables**:
   ```
   Name:  VITE_GAS_URL
   Value: https://script.google.com/macros/s/YOUR_ID/exec
   ```
5. **Redeploy** เพื่อให้ env variable มีผล

> Vercel จะ auto-deploy ทุกครั้งที่ push ไปที่ main branch

---

## วิธีใช้งาน Dashboard

### การ Sync ข้อมูล
- กด **"sync ล่าสุด HH:MM"** ที่ header เพื่อดึงข้อมูลล่าสุดจาก Google Sheets
- ครั้งแรกที่เปิดหน้าเว็บจะ sync อัตโนมัติ

### การอัปเดตสถานะ (สองวิธี)

**วิธีที่ 1 — Inline (เร็ว):**
บน ActionCard → เปลี่ยน dropdown สถานะ หรือลาก slider ความคืบหน้า  
ระบบจะ save ไปที่ Google Sheets ทันที (optimistic update)

**วิธีที่ 2 — Detail Panel (ครบถ้วน):**
คลิกที่ card ใดก็ได้ → panel จะ slide in จากขวา  
กรอก: สถานะ + ความคืบหน้า + ค่าจริงที่วัดได้ + บันทึก + อุปสรรค  
กด **"บันทึก → Google Sheets"**

### Tab Navigation
| Tab | แสดงผล |
|-----|--------|
| ทั้งหมด | ทุกแผนทั้ง 3 ข้อ |
| ข้อที่ 1/2/3 | กรองเฉพาะข้อนั้น |
| แจ้งเตือน 🔴 | เฉพาะรายการ "ติดขัด" และ "ล่าช้า" |

---

## Schema Google Sheets

Sheet: `ActionProgress`

| Column | Type | Description |
|--------|------|-------------|
| id | string | R1A1–R3A4 |
| status | string | not_started / in_progress / completed / delayed / blocked |
| progressPct | number | 0–100 |
| actualValue | string | ค่าจริงที่บันทึก |
| notes | string | บันทึกความคืบหน้า |
| blockers | string | อุปสรรค |
| lastUpdated | ISO string | เวลาอัปเดตล่าสุด |
| updatedBy | string | ชื่อผู้อัปเดต |

---

## Action IDs Reference

| ID | ข้อ | แผน |
|----|-----|-----|
| R1A1 | 1 | จัดตั้ง/ทบทวนบทบาท Medication Safety Team |
| R1A2 | 1 | จัดทำ QI Plan ด้านระบบยา |
| R1A3 | 1 | พัฒนาระบบรายงานและวิเคราะห์ ME เชิงรุก |
| R1A4 | 1 | ทบทวนมาตรฐานวิชาชีพเภสัชกรรม |
| R2A1 | 2 | ทบทวนและปรับ HAD Policy |
| R2A2 | 2 | พัฒนาระบบ Medication Reconciliation |
| R2A3 | 2 | ดำเนินการ DUE (Drug Use Evaluation) |
| R2A4 | 2 | เฝ้าระวัง ADR Type A และทบทวนใบสั่งยา |
| R3A1 | 3 | ทบทวนระบบยาสำรองฉุกเฉิน |
| R3A2 | 3 | ทบทวนระบบยาเสพติดและยาควบคุมพิเศษ |
| R3A3 | 3 | กำหนดแนวทางการจ่ายยานอกเวลา |
| R3A4 | 3 | Ward Stock Audit |

---

## Security Notes

- GAS Web App ใช้ "Execute as: Me" ทำให้ Sheet อยู่ภายใต้ account ของคุณ
- URL ของ GAS เป็น secret — ไม่ควร expose ใน public repo
- ใช้ Vercel environment variables (ไม่ commit `.env.local`)
- ถ้าต้องการ auth เพิ่ม: สามารถ restrict "Who has access" เป็น "Anyone with Google Account"  
  แล้วเพิ่ม Bearer token header ใน `gasApi.ts`

---

## Troubleshooting

| ปัญหา | วิธีแก้ |
|-------|---------|
| ปุ่ม sync ขึ้น error | ตรวจสอบ `VITE_GAS_URL` ใน `.env.local` |
| GAS ตอบ 401 | Redeploy GAS ด้วย "Anyone" access |
| ข้อมูลไม่ update | ต้อง redeploy GAS ทุกครั้งที่แก้ Code.gs |
| CORS error | GAS Web App ไม่ต้องตั้ง CORS (จัดการโดย Google) |
| Build fail Vercel | ตรวจสอบ `VITE_GAS_URL` ใน Vercel env settings |

---

## License

Internal use — โรงพยาบาลสระโบสถ์ · ฝ่ายเภสัชกรรม  
ห้ามเผยแพร่ข้อมูลผู้ป่วยหรือข้อมูลความเสี่ยงผ่านระบบนี้
