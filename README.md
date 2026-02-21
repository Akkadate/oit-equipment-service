# OIT AssetLink

**ระบบบริหารจัดการอุปกรณ์ห้องเรียน**
สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ (NBU)

---

## ภาพรวม

OIT AssetLink ช่วยให้เจ้าหน้าที่สามารถ:

- ดู **Dashboard** สถานะห้องเรียนทุกอาคาร/วิทยาเขต แบบ real-time
- **ตรวจสอบอุปกรณ์** ผ่าน QR Code ติดในห้อง (Staff/Admin)
- **แจ้งซ่อม** อุปกรณ์ผ่าน QR Code โดยไม่ต้อง login (อาจารย์/ผู้ใช้ทั่วไป)
- ติดตาม **คำร้องซ่อม** และอัปเดตสถานะ
- ออก **รายงาน** สถานะอุปกรณ์ / การแจ้งซ่อม / การตรวจสอบประจำสัปดาห์
- รับ **Push Notification** (PWA) เมื่อมีการแจ้งซ่อมใหม่

---

## Tech Stack

| ส่วน | เทคโนโลยี |
| ---- | --------- |
| Frontend / Backend | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Push Notification | Web Push API (VAPID) |
| QR Code | `qrcode` npm + Canvas API |
| PWA | next-pwa / Service Worker |

---

## URL Routes

```text
/                         → Dashboard รวม (admin/staff)
/status                   → หน้าสถานะสาธารณะ (ไม่ต้อง login)
/room/[id]                → รายละเอียดห้อง + อุปกรณ์ทั้งหมด

# QR Code (public)
/scan/[token]             → จุดเข้าหลักเมื่อสแกน QR
/scan/[token]/inspect     → ตรวจสอบอุปกรณ์ (staff)
/scan/[token]/report      → แจ้งซ่อม (ผู้ใช้ทั่วไป)

# Admin
/admin/equipment          → จัดการอุปกรณ์
/admin/equipment-types    → จัดการประเภทอุปกรณ์
/admin/rooms              → จัดการห้อง + พิมพ์ QR Code
/admin/buildings          → จัดการอาคาร
/admin/campuses           → จัดการวิทยาเขต
/admin/repairs            → ติดตามคำร้องซ่อม
/admin/reports            → รายงานสรุปทั้งหมด
```

---

## User Roles

| Action | Admin | Staff | ผู้ใช้ทั่วไป |
| ------ | ----- | ----- | ----------- |
| Dashboard / รายงาน | ✅ | ✅ | ❌ |
| ตรวจสอบอุปกรณ์ (QR) | ✅ | ✅ | ❌ |
| แจ้งซ่อม | ✅ | ✅ | ✅ |
| จัดการข้อมูล / QR | ✅ | ❌ | ❌ |
| รับ Push Notification | ✅ | ✅ | ❌ |

---

## สถานะห้องเรียน

| สี | ความหมาย |
| -- | -------- |
| 🟢 เขียว | อุปกรณ์ทุกชิ้นปกติ |
| 🟡 เหลือง | มีอุปกรณ์ชำรุดอย่างน้อย 1 ชิ้น |
| 🔴 แดง | มีอุปกรณ์รอเปลี่ยนอย่างน้อย 1 ชิ้น |
| ⚪ เทา | ยังไม่มีข้อมูลการตรวจสอบ |

---

## การติดตั้ง

### 1. Environment Variables

สร้างไฟล์ `.env.local` จาก `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=https://oitservice.northbkk.ac.th

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:oit@northbkk.ac.th

# Telegram (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 2. Database

รัน schema หลักใน Supabase SQL Editor:

```bash
supabase/schema.sql
```

จากนั้น apply migrations เพิ่มเติมตามลำดับ (ดู [`supabase/migrations/README.md`](supabase/migrations/README.md))

### 3. รัน Development Server

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

### 4. Build & Deploy (Self-hosted)

```bash
npm run build
npm start        # หรือใช้ PM2 / systemd
```

---

## โครงสร้างไฟล์สำคัญ

```text
src/
├── app/
│   ├── page.tsx                    # Dashboard หลัก
│   ├── status/page.tsx             # หน้าสาธารณะ (ไม่ต้อง login)
│   ├── room/[id]/page.tsx          # รายละเอียดห้อง
│   ├── scan/[token]/               # QR scan routes
│   ├── admin/
│   │   ├── repairs/                # จัดการคำร้องซ่อม
│   │   ├── reports/                # รายงาน (tabs)
│   │   ├── rooms/                  # จัดการห้อง + QR
│   │   ├── buildings/              # จัดการอาคาร
│   │   ├── campuses/               # จัดการวิทยาเขต
│   │   └── equipment/              # จัดการอุปกรณ์
│   └── api/
│       ├── dashboard/              # GET สถานะทุกห้อง
│       ├── reports/export/[type]/  # CSV export (9 ประเภท)
│       ├── rooms/[id]/qr/          # สร้าง QR Code
│       └── push/                   # Web Push endpoints
├── components/
│   ├── dashboard/
│   │   ├── DashboardContent.tsx    # Dashboard admin (grid + dot view)
│   │   ├── PublicDotDashboard.tsx  # Dashboard สาธารณะ
│   │   ├── RoomStatusCard.tsx      # Card แสดงสถานะห้อง
│   │   └── StatusSummaryBar.tsx    # Bar สรุปสถานะ
│   ├── qr/QRCodeGenerator.tsx      # สร้าง + พิมพ์ QR Code
│   └── shared/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── supabase-server.ts          # Server-side client
│   ├── webpush.ts                  # Web Push helper
│   ├── qr-canvas.ts                # Composite QR image (Canvas API)
│   └── equipment.ts                # Business logic
└── types/index.ts                  # TypeScript interfaces
```

---

## รายงาน (Reports)

| Tab | รายงาน | CSV |
| --- | ------ | --- |
| สถานะอุปกรณ์ | ภาพรวมตามอาคาร | ✅ |
| สถานะอุปกรณ์ | อุปกรณ์รอเปลี่ยน | ✅ |
| สถานะอุปกรณ์ | ห้องที่ยังไม่ตรวจ (30 วัน) | ✅ |
| การแจ้งซ่อม | รายเดือน (12 เดือน) | ✅ |
| การแจ้งซ่อม | ห้องที่แจ้งซ่อมบ่อย (Top 10) | ✅ |
| การแจ้งซ่อม | อุปกรณ์ที่แจ้งซ่อมบ่อย (Top 10) | ✅ |
| การแจ้งซ่อม | คำร้องซ่อมค้างอยู่ | ✅ |
| ประวัติการตรวจสอบ | 30 รายการล่าสุด | ✅ |
| ตรวจสอบประจำสัปดาห์ | วันตรวจล่าสุดทุกห้อง | ✅ |

---

## QR Code

- QR แต่ละห้องลิงก์ไปที่ `/scan/[qrToken]`
- ใช้ `qrToken` (UUID) แทน `room_id` โดยตรง เพื่อความปลอดภัย
- Admin สามารถ regenerate token ได้
- พิมพ์รายห้อง หรือพิมพ์ทั้งหมดในคราวเดียว (batch print, 3 คอลัมน์ A4)
- รูปประกอบด้วย: โลโก้ "NBU | OIT AssetLink" + QR + รหัสห้อง/อาคาร/วิทยาเขต
- ใช้ font Google Prompt

---

## Migrations

ดูรายละเอียดที่ [`supabase/migrations/README.md`](supabase/migrations/README.md)
