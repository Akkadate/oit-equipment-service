# ระบบบริหารจัดการอุปกรณ์ห้องเรียน — เอกสารระบบ
### OIT Equipment Service System — System Documentation
**สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ**

> เอกสารนี้อธิบายระบบที่สร้างขึ้นจริงแล้ว ณ วันที่ 20 กุมภาพันธ์ 2569
> ใช้อ้างอิงสำหรับการพัฒนาในระยะถัดไป

---

## 1. ภาพรวมระบบ (System Overview)

ระบบจัดการสถานะอุปกรณ์ห้องเรียนสำหรับมหาวิทยาลัยนอร์ทกรุงเทพ ครอบคลุม 3 วิทยาเขต รองรับ 3 กลุ่มผู้ใช้:

| กลุ่มผู้ใช้ | การเข้าถึง | ความสามารถหลัก |
|-------------|-----------|----------------|
| **Admin** | Login (Supabase Auth, role=admin) | จัดการข้อมูลทุกอย่าง, สร้าง QR, กำหนด sort_order วิทยาเขต |
| **Staff** | Login (Supabase Auth, role=staff) | ตรวจสอบอุปกรณ์ผ่าน QR, อัปเดตสถานะการซ่อม |
| **User/อาจารย์** | ไม่ต้อง Login | สแกน QR แจ้งซ่อม, ดูสถานะห้องสาธารณะ |

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Component Library | shadcn/ui + Radix UI | — |
| Icons | Lucide React | ^0.574.0 |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2.97.0 |
| Auth | Supabase Auth (SSR) | @supabase/ssr ^0.8.0 |
| Realtime | Supabase Realtime (postgres_changes) | — |
| QR Code | qrcode npm package | ^1.5.4 |
| Image Processing | Sharp | ^0.34.5 |
| Notifications | Telegram Bot API | — |
| PWA | @ducanh2912/next-pwa | ^10.2.9 |
| Toast | Sonner | ^2.0.7 |

**Build commands:**
```bash
npm run dev     # Development (Turbopack)
npm run build   # Production build (Webpack)
npm run start   # Production server (default port 3001)
```

---

## 3. โครงสร้าง URL / Routes

```
/                           → Dashboard หลัก (ต้อง Login)
/status                     → Dashboard สาธารณะ ไม่ต้อง Login (dot view only)
/login                      → หน้า Login

# ห้องเรียน
/room/[roomId]              → รายละเอียดห้อง + อุปกรณ์ + ประวัติตรวจสอบ + แจ้งซ่อม

# QR Code (สาธารณะ)
/scan/[qrToken]             → Landing: แสดงข้อมูลห้อง + รายการซ่อมค้าง + เลือก role
/scan/[qrToken]/inspect     → ตรวจสอบอุปกรณ์ (ต้อง Login: staff/admin)
/scan/[qrToken]/report      → แจ้งซ่อม (ไม่ต้อง Login)

# Admin
/admin/campuses             → จัดการวิทยาเขต (CRUD + sort_order)
/admin/buildings            → จัดการอาคาร (CRUD)
/admin/rooms                → จัดการห้อง + สร้าง/Regenerate QR Code
/admin/equipment            → จัดการอุปกรณ์ (CRUD + retire + CSV import)
/admin/equipment-types      → จัดการประเภทอุปกรณ์
/admin/repairs              → ติดตามการแจ้งซ่อม + กรองตามวิทยาเขต + อัปเดตสถานะ
```

**Middleware protection** (`src/middleware.ts`):
```
/ → ต้อง Login
/admin/* → ต้อง Login
/scan/[token]/inspect → ต้อง Login
ที่เหลือทั้งหมด → Public
```

---

## 4. Database Schema (สมบูรณ์)

> รัน `supabase/schema.sql` เพื่อสร้าง schema ตั้งต้น
> จากนั้นรัน migration files ตามลำดับ

### Tables

```sql
-- วิทยาเขต
campuses (
  id          UUID PK DEFAULT gen_random_uuid(),
  code        VARCHAR(20) UNIQUE NOT NULL,      -- e.g. 'NBK-NORTH', 'RANGSIT'
  name        VARCHAR(100) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 99,           -- [migration] กำหนดลำดับแสดงผล
  created_at  TIMESTAMPTZ DEFAULT now()
)

-- อาคาร
buildings (
  id          UUID PK DEFAULT gen_random_uuid(),
  campus_id   UUID FK→campuses ON DELETE CASCADE,
  code        VARCHAR(20) NOT NULL,              -- e.g. 'A', 'B', 'IT'
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campus_id, code)
)

-- ห้องเรียน
rooms (
  id          UUID PK DEFAULT gen_random_uuid(),
  building_id UUID FK→buildings ON DELETE CASCADE,
  code        VARCHAR(30) NOT NULL,              -- e.g. 'A101', 'IT302'
  name        VARCHAR(100),                      -- ชื่อห้อง (optional)
  floor       INT,
  qr_token    VARCHAR(64) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(building_id, code)
)

-- ประเภทอุปกรณ์
equipment_types (
  id    SERIAL PK,
  name  VARCHAR(100) UNIQUE NOT NULL             -- e.g. 'โปรเจกเตอร์', 'คอมพิวเตอร์'
)

-- อุปกรณ์
equipment (
  id            UUID PK DEFAULT gen_random_uuid(),
  room_id       UUID FK→rooms ON DELETE CASCADE,
  type_id       INT FK→equipment_types,
  name          VARCHAR(150) NOT NULL,           -- e.g. 'โปรเจกเตอร์ EPSON EB-X51'
  asset_code    VARCHAR(50) UNIQUE NOT NULL,     -- e.g. 'NBK-PJ-0042'
  serial_number VARCHAR(100),
  installed_at  DATE,
  note          TEXT,
  retired_at    TIMESTAMPTZ,                     -- [migration] null=ใช้งาน, non-null=เลิกใช้
  created_at    TIMESTAMPTZ DEFAULT now()
)

-- บันทึกการตรวจสอบอุปกรณ์
equipment_inspections (
  id           UUID PK DEFAULT gen_random_uuid(),
  equipment_id UUID FK→equipment ON DELETE CASCADE,
  room_id      UUID FK→rooms,
  inspected_by UUID,                             -- Supabase Auth user id
  status       equipment_status NOT NULL DEFAULT 'normal',
  comment      TEXT,
  photo_url    TEXT,                             -- [migration] path รูปถ่าย
  inspected_at TIMESTAMPTZ DEFAULT now()
)

-- คำแจ้งซ่อม
repair_requests (
  id              UUID PK DEFAULT gen_random_uuid(),
  equipment_id    UUID FK→equipment ON DELETE CASCADE,
  room_id         UUID FK→rooms,
  reported_by     VARCHAR(150),                  -- ชื่อผู้แจ้ง (ไม่ต้อง login)
  reporter_phone  VARCHAR(20),
  description     TEXT NOT NULL,
  status          repair_status NOT NULL DEFAULT 'pending',
  resolved_note   TEXT,
  resolved_by     VARCHAR(150),                  -- [migration] ชื่อผู้แก้ไข
  photo_url       TEXT,                          -- [migration] รูปถ่ายอุปกรณ์ที่แจ้ง
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```

### ENUMs
```sql
CREATE TYPE equipment_status AS ENUM ('normal', 'damaged', 'pending_replacement');
CREATE TYPE repair_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');
```

### Migrations (รันตามลำดับหลัง schema.sql)
```
supabase/migration_photo.sql            → เพิ่ม photo_url ใน equipment_inspections
supabase/migration_retire.sql           → เพิ่ม retired_at ใน equipment
supabase/migration_repair_resolved_by.sql → เพิ่ม resolved_by ใน repair_requests
supabase/migration_repair_photo.sql     → เพิ่ม photo_url ใน repair_requests
supabase/migration_campus_sort_order.sql → เพิ่ม sort_order ใน campuses
```

### Supabase Realtime
ต้องเพิ่ม table เข้า publication เพื่อให้ realtime ทำงาน:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE repair_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_inspections;
```

### Row Level Security (RLS)
| Table | SELECT | INSERT | UPDATE/DELETE |
|-------|--------|--------|---------------|
| campuses, buildings, rooms, equipment, equipment_types | Public (ทุกคน) | Admin only | Admin only |
| equipment_inspections | Staff + Admin | Staff + Admin | Staff + Admin |
| repair_requests | Staff + Admin | Public (ทุกคน) | Staff + Admin |

Role check ใน JWT: `auth.jwt() ->> 'role' IN ('admin', 'staff')`

---

## 5. API Endpoints

### Public (ไม่ต้อง Auth)
```
GET  /api/scan/[token]          → ข้อมูลห้องจาก QR token
                                   Response: { room, equipment[], active_repairs[] }
                                   active_repairs = status IN ('pending','in_progress')
                                   equipment excludes retired_at != null

POST /api/repairs               → สร้างคำแจ้งซ่อม + ส่ง Telegram notify
POST /api/repairs/upload        → อัปเดตรูปถ่ายซ่อม → /public/uploads/repairs/
```

### Read (ต้องการ Service Role Key — ผ่าน API ใช้ได้ทุกคน)
```
GET  /api/dashboard             → CampusSummary[] เรียงตาม sort_order, code
                                   คำนวณ room status จาก latest inspection per equipment
GET  /api/campuses              → Campus[] เรียงตาม sort_order, name
GET  /api/campuses/[id]         → Campus
GET  /api/buildings             → Building[] (filterable: ?campusId=)
GET  /api/buildings/[id]        → Building
GET  /api/rooms                 → Room[] (filterable: ?buildingId=, ?campusId=)
GET  /api/rooms/[id]            → Room + building + campus
GET  /api/rooms/[id]/qr         → QR Code data URL (PNG with room info overlay)
GET  /api/equipment             → Equipment[] (filterable: ?roomId=, excludes retired)
GET  /api/equipment/[id]        → Equipment
GET  /api/equipment-types       → EquipmentType[]
GET  /api/inspections           → Inspection[] (filterable: ?roomId=, with inspector name)
GET  /api/repairs               → RepairRequest[] (filterable: ?roomId=, ?status=)
                                   includes campus sort_order for filtering UI
```

### Write (ต้อง Auth)
```
POST   /api/campuses            → create { code, name, sort_order }
PUT    /api/campuses/[id]       → update { code, name, sort_order }
DELETE /api/campuses/[id]       → delete

POST   /api/buildings           → create { campus_id, code, name }
PUT    /api/buildings/[id]      → update
DELETE /api/buildings/[id]      → delete

POST   /api/rooms               → create { building_id, code, name, floor }
PUT    /api/rooms/[id]          → update
DELETE /api/rooms/[id]          → delete
POST   /api/rooms/[id]/qr       → regenerate qr_token

POST   /api/equipment           → create single equipment
POST   /api/equipment/import    → bulk import array
PUT    /api/equipment/[id]      → update (includes retire: set retired_at = now())
DELETE /api/equipment/[id]      → delete

POST   /api/equipment-types     → create
PUT    /api/equipment-types/[id] → update
DELETE /api/equipment-types/[id] → delete

POST   /api/inspections         → batch inspection submit { room_id, inspections[] }
                                   inspections: [{ equipment_id, status, comment, photo_url? }]
POST   /api/inspections/upload  → upload inspection photo → /public/uploads/inspections/

PUT    /api/repairs/[id]        → update { status, resolved_note, resolved_by }
```

---

## 6. โครงสร้าง Source Code

```
src/
├── app/
│   ├── page.tsx                    # Dashboard (login required, server component)
│   ├── status/page.tsx             # Public dot dashboard (no login)
│   ├── login/page.tsx              # Supabase Auth login form
│   ├── room/[id]/
│   │   ├── page.tsx                # Server: fetch room+equipment+repairs+inspections
│   │   └── RoomDetail.tsx          # Client: render with dual status badge + repair count
│   ├── scan/[token]/
│   │   ├── page.tsx                # QR landing: role selection + active repairs list
│   │   ├── inspect/page.tsx        # Staff inspection form
│   │   └── report/page.tsx         # Public repair form
│   ├── admin/
│   │   ├── campuses/               # CampusManager.tsx (sort_order, CRUD)
│   │   ├── buildings/              # BuildingManager.tsx
│   │   ├── rooms/                  # RoomManager.tsx (QR generate/regenerate)
│   │   ├── equipment/              # EquipmentManager.tsx (retire, bulk import, search)
│   │   ├── equipment-types/        # EquipmentTypeManager.tsx
│   │   └── repairs/                # RepairsList.tsx + RepairStatusUpdater.tsx
│   └── api/                        # Route Handlers (ดูหัวข้อ 5)
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardContent.tsx    # Client: grid/dot toggle, realtime, polling
│   │   ├── PublicDotDashboard.tsx  # Client: public dot-only, no links, hover tooltip
│   │   ├── RoomStatusCard.tsx      # Grid view card with status bar + repair badge
│   │   ├── StatusSummaryBar.tsx    # Summary stats bar per campus
│   │   └── RealtimeDashboardRefresher.tsx  # (legacy, ไม่ใช้แล้ว)
│   ├── equipment/
│   │   ├── InspectionForm.tsx      # Staff: batch inspection + photo capture
│   │   ├── RepairRequestForm.tsx   # Public: repair form + offline queue + localStorage
│   │   ├── PhotoCapture.tsx        # Image capture/upload component
│   │   └── ActiveRepairsSection.tsx # แสดง active repairs ในห้อง
│   ├── shared/
│   │   ├── Navbar.tsx              # Navigation + mobile hamburger + auth profile
│   │   ├── OfflineBanner.tsx       # Offline status + queue sync indicator
│   │   └── StatusBadge.tsx         # Reusable status badge with Thai labels
│   ├── qr/
│   │   └── QRCodeGenerator.tsx     # QR display + download as PNG
│   └── ui/                         # shadcn/ui base components
│
├── lib/
│   ├── supabase.ts                 # createClient() (browser) + createServiceClient() (server)
│   ├── supabase-server.ts          # createServerClient() for Server Components
│   ├── equipment.ts                # calcRoomStatus(), statusLabel, statusColor, repairStatusLabel
│   ├── qr.ts                       # generateQRDataURL() using qrcode package
│   ├── qr-canvas.ts                # generateQRWithInfo() - QR + room text overlay (Canvas)
│   ├── offlineQueue.ts             # localStorage queue: enqueue/flush/remove repair requests
│   ├── notify.ts                   # sendTelegramNotify() + buildRepairNotifyMessage()
│   └── utils.ts                    # cn() (clsx + tailwind-merge)
│
└── types/
    └── index.ts                    # TypeScript interfaces (ดูหัวข้อ 7)
```

---

## 7. TypeScript Types

```typescript
// Core entities
interface Campus       { id, code, name, sort_order, created_at }
interface Building     { id, campus_id, code, name, created_at, campus? }
interface Room         { id, building_id, code, name?, floor?, qr_token, created_at, building?, status?, last_inspected_at?, equipment_count? }
interface EquipmentType { id, name }
interface Equipment    { id, room_id, type_id, name, asset_code, serial_number?, installed_at?, note?, created_at, equipment_type?, latest_status?, latest_comment?, latest_inspected_at? }
interface EquipmentInspection { id, equipment_id, room_id, inspected_by, status, comment?, inspected_at, equipment? }
interface RepairRequest { id, equipment_id, room_id, reported_by, reporter_phone?, description, status, resolved_note?, created_at, updated_at, equipment?, room? }

// Enums
type EquipmentStatus = 'normal' | 'damaged' | 'pending_replacement'
type RoomStatus      = 'normal' | 'damaged' | 'pending_replacement' | 'unchecked'
type RepairStatus    = 'pending' | 'in_progress' | 'resolved' | 'closed'
type UserRole        = 'admin' | 'staff' | 'user'

// Dashboard summary (computed by /api/dashboard)
interface RoomSummary extends Room {
  status: RoomStatus
  last_inspected_at?: string
  equipment_count: number
  pending_repairs: number              // count of pending+in_progress repairs
}
interface BuildingSummary extends Building {
  rooms: RoomSummary[]
  total_rooms: number
  rooms_normal: number
  rooms_damaged: number
  rooms_critical: number              // pending_replacement count
  rooms_unchecked: number
}
interface CampusSummary extends Campus {
  buildings: BuildingSummary[]
}

// API payloads
interface InspectionSubmit {
  room_id: string
  inspections: { equipment_id, status, comment?, photo_url? }[]
}
interface RepairRequestSubmit {
  equipment_id, room_id, reported_by, reporter_phone?, description, photo_url?
}
interface ScanPageData {
  room: Room & { building: Building & { campus: Campus } }
  equipment: Equipment[]
  active_repairs: RepairRequest[]
}
```

---

## 8. สถานะการคำนวณ (Status Logic)

### Room Status (คำนวณจาก latest inspection ของแต่ละชิ้น)
```
pending_replacement  ← มีอุปกรณ์อย่างน้อย 1 ชิ้น status = 'pending_replacement'
damaged              ← มีอุปกรณ์อย่างน้อย 1 ชิ้น status = 'damaged' (และไม่มี pending_replacement)
normal               ← อุปกรณ์ทุกชิ้น status = 'normal'
unchecked            ← ยังไม่มี inspection record เลย (หรือไม่มีอุปกรณ์)
```

ฟังก์ชัน: `calcRoomStatus(statuses: EquipmentStatus[]): RoomStatus` ใน `src/lib/equipment.ts`

### Equipment Status Colors
```
normal            → 🟢 bg-emerald-500  (badge: bg-green-100 text-green-800)
damaged           → 🟡 bg-amber-500   (badge: bg-yellow-100 text-yellow-800)
pending_replacement → 🔴 bg-red-500   (badge: bg-red-100 text-red-800)
unchecked         → ⚪ bg-gray-300    (badge: bg-gray-100 text-gray-600)
```

### Repair Status Colors
```
pending     → bg-orange-100 text-orange-800  (รอดำเนินการ)
in_progress → bg-blue-100 text-blue-800     (กำลังซ่อม)
resolved    → bg-green-100 text-green-800    (ซ่อมแล้ว)
closed      → bg-gray-100 text-gray-600     (ปิดงาน)
```

---

## 9. Features ที่สร้างแล้ว

### Dashboard หลัก (`/`)
- แสดง campus → building → room แบบลำดับชั้น
- 2 โหมดการแสดงผล: **การ์ด** (grid card) และ **จุด** (ultra-compact dot)
- Toggle บันทึกลง localStorage (`oit_dashboard_view`)
- Real-time: Supabase `postgres_changes` subscription บน `repair_requests` + `equipment_inspections`
- Polling fallback ทุก 30 วินาที
- Debounce 800ms เพื่อ batch rapid events
- Live indicator: จุดเขียวกะพริบ (SUBSCRIBED) / จุดเทา (polling)
- Building card เปลี่ยนเป็นสีส้มเมื่อมีการแจ้งซ่อมค้าง + badge `🔧 N`
- Room dot มี orange ring เมื่อมีการแจ้งซ่อมค้าง
- Hover tooltip บน dot แสดง: รหัสห้อง, สถานะ, จำนวนแจ้งซ่อม

### Public Status Page (`/status`)
- ไม่ต้อง Login
- Dot view เท่านั้น (ไม่มี Link ไปยัง room detail)
- Hover tooltip แสดง: รหัสห้อง, สถานะ, จำนวนแจ้งซ่อม
- Real-time + polling เหมือน dashboard หลัก
- Header เรียบง่าย ไม่มี Navbar

### QR Scan Landing (`/scan/[token]`)
- Public, ไม่ต้อง Login
- แสดงข้อมูลห้อง: อาคาร, วิทยาเขต, ชั้น
- แสดง active repairs (pending + in_progress) ด้านล่าง card เมื่อมี
- ปุ่มเลือก role: ตรวจสอบอุปกรณ์ (staff) / แจ้งซ่อม (ทั่วไป)

### Staff Inspection (`/scan/[token]/inspect`)
- ต้อง Login (staff หรือ admin)
- แสดง active repairs ที่ด้านบน
- Batch submit ทั้งห้องครั้งเดียว
- แต่ละอุปกรณ์: เลือกสถานะ + comment + ถ่ายรูป
- Upload รูปไปยัง `/api/inspections/upload` → `public/uploads/inspections/`
- แสดงประวัติการตรวจสอบครั้งก่อน

### Repair Request Form (`/scan/[token]/report`)
- Public, ไม่ต้อง Login
- เลือกอุปกรณ์ที่มีปัญหา (เลือกได้หลายชิ้น)
- กรอกชื่อ + เบอร์โทร (บันทึกลง localStorage `oit_reporter` สำหรับครั้งถัดไป)
- ถ่ายรูปอุปกรณ์ที่แจ้งซ่อมได้ (per equipment)
- รองรับ Offline: queue ลง localStorage ส่งเมื่อมีสัญญาณ
- ส่ง Telegram notification เมื่อ submit สำเร็จ

### Room Detail (`/room/[id]`)
- แสดงข้อมูล: อาคาร, วิทยาเขต, ชั้น, รหัสห้อง
- รายการอุปกรณ์พร้อมสถานะ (latest inspection) + badge `🔧 แจ้งซ่อม` หากมี active repairs
- รายการซ่อมที่ยังค้างอยู่
- ประวัติการตรวจสอบย้อนหลัง

### Admin — จัดการข้อมูลหลัก
- **Campus Manager**: CRUD + `sort_order` กำหนดลำดับแสดงผล
- **Building Manager**: CRUD, เชื่อม campus
- **Room Manager**: CRUD, generate/regenerate QR token, download QR PNG (Canvas overlay)
- **Equipment Manager**: CRUD, retire (soft delete), bulk import CSV/JSON, search, pagination
- **Equipment Types**: CRUD
- **Repairs Admin**: แสดงรายการซ่อมทั้งหมด, กรองตามวิทยาเขต (checkbox + localStorage `oit_repair_campuses`), tab by status, อัปเดตสถานะ, แสดงรูปถ่าย

### Notifications
- Telegram Bot แจ้งเตือนทันทีเมื่อมีการแจ้งซ่อมใหม่
- ข้อความรวม: ห้อง, อาคาร, วิทยาเขต, อุปกรณ์, asset_code, ชื่อผู้แจ้ง, เบอร์โทร, รายละเอียด

### PWA Support
- Service Worker สำหรับ offline caching
- รองรับ "Add to Home Screen"
- Reload on online event

---

## 10. Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Application URL (required for server-side self-fetch)
NEXT_PUBLIC_APP_URL=https://oitservice.northbkk.ac.th
PORT=3001                           # default port for internalUrl()

# Telegram Notifications (optional — ถ้าไม่ใส่ จะ skip โดยอัตโนมัติ)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

**หมายเหตุ:** `internalUrl()` ใน `src/lib/equipment.ts` ใช้ `process.env.PORT ?? '3001'` เพื่อ construct localhost URL สำหรับ server-side API call

---

## 11. localStorage Keys

| Key | ค่า | ใช้ใน |
|-----|-----|-------|
| `oit_dashboard_view` | `'grid'` \| `'dot'` | DashboardContent — view mode preference |
| `oit_reporter` | `{ name, phone }` JSON | RepairRequestForm — pre-fill reporter info |
| `oit_offline_repairs` | `QueuedRepair[]` JSON | offlineQueue — pending repair submissions |
| `oit_repair_campuses` | `string[]` JSON | RepairsList admin — campus filter selection |

---

## 12. File Upload

รูปถ่ายเก็บบน Server filesystem (ไม่ใช้ Supabase Storage):

| Endpoint | Destination |
|----------|-------------|
| `POST /api/inspections/upload` | `public/uploads/inspections/[uuid].[ext]` |
| `POST /api/repairs/upload` | `public/uploads/repairs/[uuid].[ext]` |

- ใช้ `sharp` resize/compress ก่อนบันทึก
- Return: `{ url: '/uploads/[type]/[filename]' }`
- Served directly โดย Next.js จาก `/public/` directory

---

## 13. Supabase Auth Setup

ใช้ Supabase Auth + JWT `role` claim:

1. สร้าง user ใน Supabase Auth dashboard
2. ตั้ง custom JWT claim `role` = `'admin'` หรือ `'staff'` ผ่าน Supabase Hook หรือ SQL function
3. RLS policies ตรวจสอบ `auth.jwt() ->> 'role'`

**Display name:** เก็บใน `user_metadata.full_name` ของ Supabase Auth user

---

## 14. Real-time Architecture

```
Supabase Realtime
  ├── subscribe to: repair_requests   (INSERT/UPDATE/DELETE)
  └── subscribe to: equipment_inspections (INSERT/UPDATE/DELETE)
      ↓ event received
      debounce 800ms (batch rapid events)
      ↓
      fetch /api/dashboard (no-store)
      ↓
      setCampuses(data) → React re-render

Fallback polling: setInterval(refresh, 30_000)
```

Component: `DashboardContent.tsx` จัดการทั้ง Realtime + polling ในตัวเอง

---

## 15. สิ่งที่ยังไม่ได้สร้าง (Phase 2 Candidates)

ต่อไปนี้เป็นฟีเจอร์ที่ระบุไว้ใน CLAUDE.md แต่ยังไม่ได้ implement:

### High Priority
- [ ] **Inspection Schedule / Reminder** — กำหนดรอบตรวจสอบ (รายสัปดาห์/เดือน) + แจ้งเตือนเมื่อห้องเกินกำหนดตรวจ
- [ ] **Equipment Photo Field** — field `photo_url` ใน `equipment` table สำหรับรูปอุปกรณ์ที่ติดตั้ง
- [ ] **Export PDF Report** — รายงานสรุปสถานะทั้งระบบ / รายห้อง / รายอาคาร
- [ ] **History Timeline** — แสดง timeline ของ inspections + repairs ใน room detail แบบ visual
- [ ] **Repair Assignment** — assign การซ่อมให้ช่างคนใดคนหนึ่ง
- [ ] **LINE Notify** — เพิ่ม LINE notification นอกจาก Telegram (หรือแทน)

### Medium Priority
- [ ] **Dashboard Filter** — กรองตาม: วิทยาเขต, อาคาร, สถานะ, ช่วงเวลาที่ตรวจล่าสุด
- [ ] **Search** — ค้นหา equipment ทั่วระบบด้วย asset_code หรือ serial_number
- [ ] **Inspection Statistics** — กราฟ/สรุปสถิติการตรวจสอบรายเดือน
- [ ] **QR Print Layout** — PDF หลายห้องในหน้าเดียวสำหรับพิมพ์ครั้งละหลายห้อง
- [ ] **Staff Management** — Admin จัดการ staff accounts (ตอนนี้ต้องไปทำใน Supabase dashboard)
- [ ] **Repair SLA tracking** — วัด mean time to repair, overdue alerts

### Nice to Have
- [ ] **PWA Push Notifications** — แจ้งเตือน repair ใหม่ผ่าน browser push
- [ ] **Dark Mode** — ตอนนี้ใช้ next-themes ติดตั้งแล้วแต่ยังไม่ implement
- [ ] **Multi-photo per repair** — ปัจจุบันเก็บได้ 1 รูปต่อรายการ
- [ ] **Barcode Scanner** — scan barcode ของ asset_code แทนการพิมพ์เมื่อเพิ่มอุปกรณ์
- [ ] **IndexedDB for offline** — เปลี่ยนจาก localStorage เป็น IndexedDB สำหรับ offline queue ที่ robust กว่า
- [ ] **Supabase Storage** — ย้ายรูปภาพจาก filesystem ไปยัง Supabase Storage (รองรับ CDN + cleanup)

---

## 16. Architecture Decisions & Notes

### ทำไมไม่ใช้ Supabase Storage สำหรับรูปภาพ
ปัจจุบัน upload ไปยัง `public/` ของ server เพราะง่ายกว่าในการ setup ช่วง development
**Phase 2:** แนะนำย้ายไป Supabase Storage bucket เพื่อ: CDN, cleanup policy, ไม่กินพื้นที่ server

### ทำไม DashboardContent จัดการ realtime เอง ไม่ผ่าน router.refresh()
`router.refresh()` re-runs Server Component แต่ไม่ trigger client component re-render ถ้า prop ไม่เปลี่ยน
แก้โดยให้ `DashboardContent` มี state เป็นของตัวเองและ fetch `/api/dashboard` โดยตรง

### Role ใน JWT ตั้งอย่างไร
ต้องสร้าง Supabase Auth Hook (Database Function) ที่เพิ่ม `role` เข้า JWT claim ตามข้อมูล custom table หรือ user metadata
ตัวอย่าง: [Supabase Docs — Custom Claims](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)

### internalUrl() สำหรับ server-side fetch
Next.js Server Component ไม่สามารถเรียก relative URL `/api/...` ได้โดยตรง
`internalUrl('/api/dashboard')` → `http://localhost:3001/api/dashboard`

### Offline Queue
localStorage-based เพราะรองรับ iOS Safari ได้ดีกว่า service worker background sync
ควรเปลี่ยนเป็น IndexedDB ใน phase ต่อไปหาก queue มีขนาดใหญ่

---

*เอกสารนี้สร้างอัตโนมัติจาก codebase ณ วันที่ 20 กุมภาพันธ์ 2569*
*อัปเดตเมื่อมีการเปลี่ยนแปลง schema, API, หรือ features หลัก*
