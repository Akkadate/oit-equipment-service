-- ============================================================
-- Classroom Equipment Status System
-- Database Schema
-- ============================================================

-- วิทยาเขต
CREATE TABLE campuses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       VARCHAR(20) UNIQUE NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- อาคาร
CREATE TABLE buildings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id  UUID REFERENCES campuses(id) ON DELETE CASCADE,
  code       VARCHAR(20) NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campus_id, code)
);

-- ห้องเรียน
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  code        VARCHAR(30) NOT NULL,
  name        VARCHAR(100),
  floor       INT,
  qr_token    VARCHAR(64) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(building_id, code)
);

-- ประเภทอุปกรณ์
CREATE TABLE equipment_types (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- อุปกรณ์ในห้อง
CREATE TABLE equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID REFERENCES rooms(id) ON DELETE CASCADE,
  type_id       INT REFERENCES equipment_types(id),
  name          VARCHAR(150) NOT NULL,
  asset_code    VARCHAR(50) UNIQUE NOT NULL,
  serial_number VARCHAR(100),
  installed_at  DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ENUM สถานะอุปกรณ์
CREATE TYPE equipment_status AS ENUM ('normal', 'damaged', 'pending_replacement');

-- บันทึกการตรวจสอบอุปกรณ์
CREATE TABLE equipment_inspections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  room_id      UUID REFERENCES rooms(id),
  inspected_by UUID,
  status       equipment_status NOT NULL DEFAULT 'normal',
  comment      TEXT,
  inspected_at TIMESTAMPTZ DEFAULT now()
);

-- ENUM สถานะการซ่อม
CREATE TYPE repair_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');

-- คำแจ้งซ่อม
CREATE TABLE repair_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id   UUID REFERENCES equipment(id) ON DELETE CASCADE,
  room_id        UUID REFERENCES rooms(id),
  reported_by    VARCHAR(150),
  reporter_phone VARCHAR(20),
  description    TEXT NOT NULL,
  status         repair_status NOT NULL DEFAULT 'pending',
  resolved_note  TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;

-- campuses: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "campuses_read_all" ON campuses FOR SELECT USING (true);
CREATE POLICY "campuses_admin_write" ON campuses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- buildings: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "buildings_read_all" ON buildings FOR SELECT USING (true);
CREATE POLICY "buildings_admin_write" ON buildings FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- rooms: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "rooms_read_all" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_admin_write" ON rooms FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- equipment_types: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "equipment_types_read_all" ON equipment_types FOR SELECT USING (true);
CREATE POLICY "equipment_types_admin_write" ON equipment_types FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- equipment: อ่านได้ทุกคน, เขียนได้เฉพาะ admin
CREATE POLICY "equipment_read_all" ON equipment FOR SELECT USING (true);
CREATE POLICY "equipment_admin_write" ON equipment FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- equipment_inspections: อ่านได้ admin/staff, เขียนได้ admin/staff
CREATE POLICY "inspections_read_staff" ON equipment_inspections FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "inspections_write_staff" ON equipment_inspections FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- repair_requests: อ่านได้ admin/staff, เขียนได้ทุกคน (public)
CREATE POLICY "repairs_read_staff" ON repair_requests FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "repairs_insert_public" ON repair_requests FOR INSERT
  WITH CHECK (true);
CREATE POLICY "repairs_update_staff" ON repair_requests FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============================================================
-- Seed Data (ตัวอย่าง)
-- ============================================================

-- วิทยาเขต
INSERT INTO campuses (code, name) VALUES
  ('NBK-NORTH', 'วิทยาเขตนอร์ทกรุงเทพ (หลัก)'),
  ('NBK-SOUTH', 'วิทยาเขตนอร์ทกรุงเทพ (สาขา)');

-- อาคาร (ใช้ campus_id จาก query)
WITH c AS (SELECT id FROM campuses WHERE code = 'NBK-NORTH')
INSERT INTO buildings (campus_id, code, name)
SELECT c.id, code, name FROM c, (VALUES
  ('A', 'อาคาร A'),
  ('B', 'อาคาร B'),
  ('IT', 'อาคารเทคโนโลยีสารสนเทศ')
) AS v(code, name);

-- ห้อง (อาคาร IT)
WITH b AS (
  SELECT buildings.id FROM buildings
  JOIN campuses ON buildings.campus_id = campuses.id
  WHERE campuses.code = 'NBK-NORTH' AND buildings.code = 'IT'
)
INSERT INTO rooms (building_id, code, name, floor)
SELECT b.id, code, name, floor FROM b, (VALUES
  ('IT301', 'ห้องปฏิบัติการคอมพิวเตอร์ 1', 3),
  ('IT302', 'ห้องปฏิบัติการคอมพิวเตอร์ 2', 3),
  ('IT201', 'ห้องเรียน IT 201', 2)
) AS v(code, name, floor);

-- ประเภทอุปกรณ์
INSERT INTO equipment_types (name) VALUES
  ('โปรเจกเตอร์'),
  ('คอมพิวเตอร์'),
  ('แอร์'),
  ('กล้อง CCTV'),
  ('จอแสดงผล'),
  ('ลำโพง'),
  ('ไมโครโฟน'),
  ('เราเตอร์/สวิตช์');

-- อุปกรณ์ในห้อง IT301
WITH r AS (
  SELECT rooms.id FROM rooms
  JOIN buildings ON rooms.building_id = buildings.id
  WHERE rooms.code = 'IT301'
)
INSERT INTO equipment (room_id, type_id, name, asset_code, serial_number, installed_at)
SELECT
  r.id,
  t.id,
  e.name,
  e.asset_code,
  e.serial_number,
  e.installed_at::date
FROM r,
(VALUES
  ('โปรเจกเตอร์', 'โปรเจกเตอร์ EPSON EB-X51', 'NBK-PJ-0001', 'EP-X51-001', '2023-01-15'),
  ('แอร์', 'แอร์ Daikin 18000 BTU', 'NBK-AC-0001', 'DK-18K-001', '2022-06-01'),
  ('กล้อง CCTV', 'กล้อง HIKVISION DS-2CD2143G2', 'NBK-CCTV-0001', 'HK-2143-001', '2022-06-01')
) AS e(type_name, name, asset_code, serial_number, installed_at)
JOIN equipment_types t ON t.name = e.type_name;
