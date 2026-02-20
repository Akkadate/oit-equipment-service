-- ============================================================
-- Classroom Equipment Status System
-- Complete Database Schema (Current State)
-- สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ
-- ============================================================
-- ใช้ไฟล์นี้สำหรับ: ติดตั้งใหม่ (fresh install)
-- ทุก column รวม migration ทั้งหมดอยู่ในนี้แล้ว
-- อัปเดตล่าสุด: 2026-02-20
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE equipment_status AS ENUM ('normal', 'damaged', 'pending_replacement');
CREATE TYPE repair_status    AS ENUM ('pending', 'in_progress', 'resolved', 'closed');


-- ============================================================
-- TABLES
-- ============================================================

-- วิทยาเขต
CREATE TABLE campuses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) UNIQUE NOT NULL,       -- e.g. 'NBK-NORTH', 'RANGSIT'
  name        VARCHAR(100) NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 99,   -- ลำดับการแสดงผล (ค่าน้อย = ขึ้นก่อน)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- อาคาร
CREATE TABLE buildings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id   UUID        REFERENCES campuses(id) ON DELETE CASCADE,
  code        VARCHAR(20) NOT NULL,              -- e.g. 'A', 'B', 'IT'
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campus_id, code)
);

-- ห้องเรียน
CREATE TABLE rooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID        REFERENCES buildings(id) ON DELETE CASCADE,
  code        VARCHAR(30) NOT NULL,              -- e.g. 'A101', 'IT302'
  name        VARCHAR(100),                      -- ชื่อห้อง (optional)
  floor       INT,
  qr_token    VARCHAR(64) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(building_id, code)
);

-- ประเภทอุปกรณ์
CREATE TABLE equipment_types (
  id    SERIAL      PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE             -- e.g. 'โปรเจกเตอร์', 'คอมพิวเตอร์'
);

-- อุปกรณ์ในห้อง
CREATE TABLE equipment (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID        REFERENCES rooms(id) ON DELETE CASCADE,
  type_id       INT         REFERENCES equipment_types(id),
  name          VARCHAR(150) NOT NULL,           -- e.g. 'โปรเจกเตอร์ EPSON EB-X51'
  asset_code    VARCHAR(50) UNIQUE NOT NULL,     -- e.g. 'NBK-PJ-0042'
  serial_number VARCHAR(100),
  installed_at  DATE,
  note          TEXT,
  retired_at    TIMESTAMPTZ DEFAULT NULL,        -- null = ใช้งานอยู่, non-null = จำหน่ายออก
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- บันทึกการตรวจสอบอุปกรณ์
CREATE TABLE equipment_inspections (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID             REFERENCES equipment(id) ON DELETE CASCADE,
  room_id      UUID             REFERENCES rooms(id),
  inspected_by UUID,                             -- Supabase Auth user id
  status       equipment_status NOT NULL DEFAULT 'normal',
  comment      TEXT,
  photo_url    TEXT,                             -- path รูปถ่าย เช่น /uploads/inspections/xxx.jpg
  inspected_at TIMESTAMPTZ      DEFAULT now()
);

-- คำแจ้งซ่อม
CREATE TABLE repair_requests (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID          REFERENCES equipment(id) ON DELETE CASCADE,
  room_id         UUID          REFERENCES rooms(id),
  reported_by     VARCHAR(150),                  -- ชื่อผู้แจ้ง (ไม่ต้อง login)
  reporter_phone  VARCHAR(20),
  description     TEXT          NOT NULL,
  status          repair_status NOT NULL DEFAULT 'pending',
  resolved_note   TEXT,
  resolved_by     VARCHAR(150),                  -- ชื่อเจ้าหน้าที่ที่ดำเนินการซ่อม
  photo_url       TEXT,                          -- รูปถ่ายอุปกรณ์ที่แจ้ง
  created_at      TIMESTAMPTZ   DEFAULT now(),
  updated_at      TIMESTAMPTZ   DEFAULT now()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS equipment_retired_at_idx ON equipment (retired_at);
CREATE INDEX IF NOT EXISTS equipment_room_id_idx    ON equipment (room_id);
CREATE INDEX IF NOT EXISTS inspections_equipment_id_idx ON equipment_inspections (equipment_id);
CREATE INDEX IF NOT EXISTS inspections_room_id_idx  ON equipment_inspections (room_id);
CREATE INDEX IF NOT EXISTS repairs_room_id_idx      ON repair_requests (room_id);
CREATE INDEX IF NOT EXISTS repairs_status_idx       ON repair_requests (status);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE campuses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment             ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests       ENABLE ROW LEVEL SECURITY;

-- campuses: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "campuses_read_all"    ON campuses FOR SELECT USING (true);
CREATE POLICY "campuses_admin_write" ON campuses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- buildings: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "buildings_read_all"    ON buildings FOR SELECT USING (true);
CREATE POLICY "buildings_admin_write" ON buildings FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- rooms: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "rooms_read_all"    ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_admin_write" ON rooms FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- equipment_types: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "equipment_types_read_all"    ON equipment_types FOR SELECT USING (true);
CREATE POLICY "equipment_types_admin_write" ON equipment_types FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- equipment: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "equipment_read_all"    ON equipment FOR SELECT USING (true);
CREATE POLICY "equipment_admin_write" ON equipment FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- equipment_inspections: อ่านได้และเขียนได้เฉพาะ admin/staff
CREATE POLICY "inspections_read_staff"  ON equipment_inspections FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "inspections_write_staff" ON equipment_inspections FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- repair_requests: อ่านได้ admin/staff, เขียน (INSERT) ได้ทุกคน (public), UPDATE เฉพาะ admin/staff
CREATE POLICY "repairs_read_staff"    ON repair_requests FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "repairs_insert_public" ON repair_requests FOR INSERT
  WITH CHECK (true);
CREATE POLICY "repairs_update_staff"  ON repair_requests FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));


-- ============================================================
-- SUPABASE REALTIME
-- ============================================================
-- เปิด realtime สำหรับตารางที่ dashboard ต้องการ live update
-- (ต้องรันหลังจาก table ถูกสร้างแล้ว)

ALTER PUBLICATION supabase_realtime ADD TABLE repair_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_inspections;
