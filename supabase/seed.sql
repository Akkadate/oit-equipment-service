-- ============================================================
-- Seed Data (ตัวอย่าง — ไม่ต้องรันบน production)
-- ============================================================
-- รันหลังจาก schema.sql แล้วเท่านั้น
-- ปรับ code/name ให้ตรงกับข้อมูลจริงก่อนใช้งาน
-- ============================================================


-- วิทยาเขต (ปรับ sort_order ตามต้องการ)
INSERT INTO campuses (code, name, sort_order) VALUES
  ('NBK-SAPHAN',    'วิทยาเขตสะพานใหม่',  1),
  ('NBK-RANGSIT',   'วิทยาเขตรังสิต',      2),
  ('NBK-NONTHABURI','ศูนย์นนทบุรี',         3)
ON CONFLICT (code) DO NOTHING;


-- อาคาร (ตัวอย่างวิทยาเขตสะพานใหม่)
WITH c AS (SELECT id FROM campuses WHERE code = 'NBK-SAPHAN')
INSERT INTO buildings (campus_id, code, name)
SELECT c.id, v.code, v.name FROM c, (VALUES
  ('A',  'อาคาร A'),
  ('B',  'อาคาร B'),
  ('IT', 'อาคารเทคโนโลยีสารสนเทศ')
) AS v(code, name)
ON CONFLICT (campus_id, code) DO NOTHING;


-- ห้อง (ตัวอย่างอาคาร IT)
WITH b AS (
  SELECT buildings.id FROM buildings
  JOIN campuses ON buildings.campus_id = campuses.id
  WHERE campuses.code = 'NBK-SAPHAN' AND buildings.code = 'IT'
)
INSERT INTO rooms (building_id, code, name, floor)
SELECT b.id, v.code, v.name, v.floor FROM b, (VALUES
  ('IT301', 'ห้องปฏิบัติการคอมพิวเตอร์ 1', 3),
  ('IT302', 'ห้องปฏิบัติการคอมพิวเตอร์ 2', 3),
  ('IT201', 'ห้องเรียน IT 201',              2)
) AS v(code, name, floor)
ON CONFLICT (building_id, code) DO NOTHING;


-- ประเภทอุปกรณ์
INSERT INTO equipment_types (name) VALUES
  ('โปรเจกเตอร์'),
  ('คอมพิวเตอร์'),
  ('แอร์'),
  ('กล้อง CCTV'),
  ('จอแสดงผล'),
  ('ลำโพง'),
  ('ไมโครโฟน'),
  ('เราเตอร์/สวิตช์')
ON CONFLICT (name) DO NOTHING;


-- อุปกรณ์ตัวอย่างในห้อง IT301
WITH r AS (
  SELECT rooms.id FROM rooms
  JOIN buildings  ON rooms.building_id = buildings.id
  JOIN campuses   ON buildings.campus_id = campuses.id
  WHERE campuses.code = 'NBK-SAPHAN'
    AND buildings.code = 'IT'
    AND rooms.code = 'IT301'
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
  ('โปรเจกเตอร์', 'โปรเจกเตอร์ EPSON EB-X51',            'NBK-PJ-0001',   'EP-X51-001',    '2023-01-15'),
  ('แอร์',        'แอร์ Daikin 18000 BTU',                'NBK-AC-0001',   'DK-18K-001',    '2022-06-01'),
  ('กล้อง CCTV',  'กล้อง HIKVISION DS-2CD2143G2',         'NBK-CCTV-0001', 'HK-2143-001',   '2022-06-01')
) AS e(type_name, name, asset_code, serial_number, installed_at)
JOIN equipment_types t ON t.name = e.type_name
ON CONFLICT (asset_code) DO NOTHING;
