# Classroom Equipment Status System
## สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ

## Project Overview

ระบบแสดงสถานะความพร้อมของอุปกรณ์ในห้องเรียน สำหรับบริหารจัดการอุปกรณ์ทั่วทุกวิทยาเขต อาคาร และห้องเรียน รองรับการตรวจสอบผ่าน QR Code โดยเจ้าหน้าที่และการแจ้งซ่อมโดยอาจารย์/ผู้ใช้ทั่วไป

---

## Architecture

### Tech Stack (แนะนำ)
- **Frontend:** Next.js (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes หรือ Laravel (PHP)
- **Database:** PostgreSQL (Supabase)
- **QR Code:** `qrcode` npm package / `chillerlan/php-qrcode`
- **Auth:** Supabase Auth (แยก role: admin, staff, user)

---

## Database Schema

```sql
-- วิทยาเขต
CREATE TABLE campuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) UNIQUE NOT NULL,   -- e.g. 'NBK-NORTH', 'NBK-SOUTH'
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- อาคาร
CREATE TABLE buildings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id   UUID REFERENCES campuses(id) ON DELETE CASCADE,
  code        VARCHAR(20) NOT NULL,           -- e.g. 'A', 'B', 'IT'
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campus_id, code)
);

-- ห้องเรียน
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  code        VARCHAR(30) NOT NULL,           -- e.g. 'A101', 'IT302'
  name        VARCHAR(100),                  -- ชื่อห้อง (ถ้ามี)
  floor       INT,
  qr_token    VARCHAR(64) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(building_id, code)
);

-- ประเภทอุปกรณ์
CREATE TABLE equipment_types (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE   -- e.g. 'โปรเจกเตอร์', 'คอมพิวเตอร์', 'แอร์', 'กล้อง CCTV'
);

-- อุปกรณ์ในห้อง
CREATE TABLE equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID REFERENCES rooms(id) ON DELETE CASCADE,
  type_id       INT REFERENCES equipment_types(id),
  name          VARCHAR(150) NOT NULL,        -- ชื่ออุปกรณ์ e.g. 'โปรเจกเตอร์ EPSON EB-X51'
  asset_code    VARCHAR(50) UNIQUE NOT NULL,  -- รหัสอุปกรณ์ e.g. 'NBK-PJ-0042'
  serial_number VARCHAR(100),
  installed_at  DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- สถานะอุปกรณ์ (status log)
CREATE TYPE equipment_status AS ENUM ('normal', 'damaged', 'pending_replacement');

CREATE TABLE equipment_inspections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id  UUID REFERENCES equipment(id) ON DELETE CASCADE,
  room_id       UUID REFERENCES rooms(id),
  inspected_by  UUID,                        -- staff user id
  status        equipment_status NOT NULL DEFAULT 'normal',
  comment       TEXT,
  inspected_at  TIMESTAMPTZ DEFAULT now()
);

-- แจ้งซ่อม (repair requests)
CREATE TYPE repair_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');

CREATE TABLE repair_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID REFERENCES equipment(id) ON DELETE CASCADE,
  room_id         UUID REFERENCES rooms(id),
  reported_by     VARCHAR(150),              -- ชื่อผู้แจ้ง (ไม่ต้อง login ก็ได้)
  reporter_phone  VARCHAR(20),
  description     TEXT NOT NULL,
  status          repair_status NOT NULL DEFAULT 'pending',
  resolved_note   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## URL Structure / Routes

```
/                           → Dashboard รวม (admin/staff)
/campus/[campusId]          → รายการอาคารในวิทยาเขต
/building/[buildingId]      → รายการห้องในอาคาร
/room/[roomId]              → รายละเอียดห้อง + อุปกรณ์ทั้งหมด

# QR Code routes (public access)
/scan/[qrToken]             → จุดเข้าหลักเมื่อสแกน QR
/scan/[qrToken]/inspect     → หน้าตรวจสอบอุปกรณ์ (staff)
/scan/[qrToken]/report      → หน้าแจ้งซ่อม (ผู้ใช้ทั่วไป/อาจารย์)

# Admin
/admin/equipment            → จัดการอุปกรณ์ทั้งหมด
/admin/rooms                → จัดการห้อง/สร้าง QR
/admin/repairs              → ติดตามการแจ้งซ่อม
```

---

## QR Code Logic

```
QR Code URL = https://[domain]/scan/[qrToken]

qrToken = UUID หรือ hash เฉพาะของห้อง (เก็บใน rooms.qr_token)
         ไม่ใช้ room_id โดยตรง เพื่อความปลอดภัย

เมื่อสแกน → /scan/[qrToken]
  └── ตรวจสอบ role ของผู้ใช้ (หรือถาม)
       ├── Staff/Admin  → redirect ไป /scan/[qrToken]/inspect
       └── อาจารย์/ทั่วไป → redirect ไป /scan/[qrToken]/report
```

---

## User Roles & Permissions

| Action | Admin | Staff | User (อาจารย์/ทั่วไป) |
|--------|-------|-------|----------------------|
| ดู Dashboard รวม | ✅ | ✅ | ❌ |
| สแกน QR → ดูรายการอุปกรณ์ | ✅ | ✅ | ✅ (read only) |
| บันทึกสถานะ/ตรวจสอบอุปกรณ์ | ✅ | ✅ | ❌ |
| แจ้งซ่อม | ✅ | ✅ | ✅ |
| จัดการข้อมูลอุปกรณ์/ห้อง | ✅ | ❌ | ❌ |
| สร้าง/พิมพ์ QR Code | ✅ | ❌ | ❌ |
| อัปเดตสถานะการซ่อม | ✅ | ✅ | ❌ |

---

## Key Features

### 1. QR Scan → ตรวจสอบอุปกรณ์ (Staff)
- แสดงรายการอุปกรณ์ทั้งหมดในห้อง พร้อมสถานะล่าสุด
- สำหรับแต่ละอุปกรณ์: เลือกสถานะ (ปกติ / ชำรุด / รอเปลี่ยน) + เขียน comment
- บันทึกได้เป็น batch ครั้งเดียวทั้งห้อง
- แสดงประวัติการตรวจสอบครั้งก่อน

### 2. QR Scan → แจ้งซ่อม (ผู้ใช้/อาจารย์)
- แสดงรายการอุปกรณ์ในห้อง
- เลือกอุปกรณ์ที่มีปัญหา (เลือกได้หลายชิ้น)
- กรอกชื่อผู้แจ้ง, เบอร์โทร, รายละเอียดปัญหา
- ไม่ต้อง login

### 3. Dashboard รวม
- สรุปสถานะห้องทั้งหมด แบ่งตามวิทยาเขต → อาคาร
- สี indicator: 🟢 ปกติ | 🟡 มีบางชิ้นชำรุด | 🔴 มีอุปกรณ์รอเปลี่ยน | ⚪ ยังไม่ตรวจ
- กรอง: วิทยาเขต, อาคาร, สถานะ, ช่วงเวลาที่ตรวจล่าสุด
- คลิกห้อง → ดูรายละเอียดอุปกรณ์ทั้งหมด + ประวัติการตรวจสอบ + รายการแจ้งซ่อม

### 4. การสร้างและพิมพ์ QR Code
- Admin สร้าง QR Code สำหรับแต่ละห้อง
- Export เป็น PDF/PNG สำหรับพิมพ์ติดในห้อง
- QR Code แสดง: รหัสห้อง, อาคาร, วิทยาเขต

---

## Equipment Status Calculation (Per Room)

```
ห้องมีสถานะ "ปกติ" (🟢)       = อุปกรณ์ทุกชิ้นล่าสุด = 'normal'
ห้องมีสถานะ "มีปัญหา" (🟡)    = มีอุปกรณ์อย่างน้อย 1 ชิ้น = 'damaged'
ห้องมีสถานะ "วิกฤต" (🔴)      = มีอุปกรณ์อย่างน้อย 1 ชิ้น = 'pending_replacement'
ห้องมีสถานะ "ยังไม่ตรวจ" (⚪) = ไม่มีข้อมูล inspection เลย
```

---

## File Structure (Next.js)

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── campus/[id]/page.tsx
│   ├── building/[id]/page.tsx
│   ├── room/[id]/page.tsx
│   ├── scan/[token]/
│   │   ├── page.tsx                # Landing (แยก role)
│   │   ├── inspect/page.tsx        # Staff inspection form
│   │   └── report/page.tsx         # Repair request form
│   └── admin/
│       ├── rooms/page.tsx
│       ├── equipment/page.tsx
│       └── repairs/page.tsx
├── components/
│   ├── dashboard/
│   │   ├── CampusOverview.tsx
│   │   ├── RoomStatusCard.tsx
│   │   └── StatusSummaryBar.tsx
│   ├── equipment/
│   │   ├── EquipmentList.tsx
│   │   ├── InspectionForm.tsx
│   │   └── RepairRequestForm.tsx
│   └── qr/
│       └── QRCodeGenerator.tsx
├── lib/
│   ├── supabase.ts
│   ├── equipment.ts                # business logic
│   └── qr.ts                       # QR token utilities
└── types/
    └── index.ts                    # TypeScript interfaces
```

---

## TypeScript Interfaces

```typescript
interface Campus {
  id: string
  code: string
  name: string
}

interface Building {
  id: string
  campusId: string
  code: string
  name: string
}

interface Room {
  id: string
  buildingId: string
  code: string
  name?: string
  floor?: number
  qrToken: string
  // computed
  status?: 'normal' | 'damaged' | 'pending_replacement' | 'unchecked'
  lastInspectedAt?: string
}

interface Equipment {
  id: string
  roomId: string
  typeName: string
  name: string
  assetCode: string
  serialNumber?: string
  latestStatus?: EquipmentStatus
  latestComment?: string
}

type EquipmentStatus = 'normal' | 'damaged' | 'pending_replacement'

interface Inspection {
  id: string
  equipmentId: string
  inspectedBy: string
  status: EquipmentStatus
  comment?: string
  inspectedAt: string
}

interface RepairRequest {
  id: string
  equipmentId: string
  roomId: string
  reportedBy: string
  reporterPhone?: string
  description: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
}
```

---

## API Endpoints (Next.js Route Handlers)

```
GET  /api/dashboard                     → สรุปสถานะทุกห้อง
GET  /api/rooms?campusId=&buildingId=   → รายการห้อง
GET  /api/scan/[token]                  → ข้อมูลห้องจาก QR token (public)

POST /api/inspections                   → บันทึกผลตรวจสอบ (staff)
GET  /api/inspections?roomId=           → ประวัติการตรวจสอบ

POST /api/repairs                       → สร้างคำแจ้งซ่อม (public)
GET  /api/repairs?roomId=&status=       → รายการแจ้งซ่อม
PUT  /api/repairs/[id]                  → อัปเดตสถานะการซ่อม

GET  /api/rooms/[id]/qr                 → สร้างภาพ QR Code
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://equipment.northbangkok.ac.th
```

---

## Notes & Considerations

- **QR Token Regeneration:** Admin ควร regenerate qr_token ได้ในกรณีที่ token หลุด
- **Offline Support:** พิจารณา PWA + local cache สำหรับกรณีสัญญาณอินเทอร์เน็ตไม่ดีในห้องเรียน
- **Inspection Frequency:** แนะนำให้ตั้ง reminder หรือ schedule ให้ staff ตรวจสอบห้องตามรอบ (รายสัปดาห์/เดือน)
- **Equipment Photo:** ขยายระบบด้วย field `photo_url` ใน equipment เพื่อให้ staff ถ่ายรูปอุปกรณ์ที่ชำรุดได้
- **Notification:** เพิ่ม LINE Notify / email แจ้งเตือนเมื่อมีการแจ้งซ่อมเข้ามา
