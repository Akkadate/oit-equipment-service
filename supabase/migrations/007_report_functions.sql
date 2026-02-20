-- Migration 007: Report Functions (RPC)
-- ใช้ SECURITY DEFINER เพื่อ bypass RLS และคืนค่า aggregate เสมอ
-- ไม่มีปัญหา Max Rows 1000 เพราะดึงเฉพาะผลลัพธ์ที่ aggregate แล้ว

-- ─────────────────────────────────────────────
-- 1. Executive Summary (ตัวเลขหลักทั้งหมด)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_executive_summary()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_equipment',            (SELECT COUNT(*)::int FROM equipment),
    'status_normal',              (SELECT COUNT(*)::int FROM (
                                    SELECT DISTINCT ON (equipment_id) status
                                    FROM equipment_inspections
                                    ORDER BY equipment_id, inspected_at DESC
                                  ) s WHERE s.status = 'normal'),
    'status_damaged',             (SELECT COUNT(*)::int FROM (
                                    SELECT DISTINCT ON (equipment_id) status
                                    FROM equipment_inspections
                                    ORDER BY equipment_id, inspected_at DESC
                                  ) s WHERE s.status = 'damaged'),
    'status_pending_replacement', (SELECT COUNT(*)::int FROM (
                                    SELECT DISTINCT ON (equipment_id) status
                                    FROM equipment_inspections
                                    ORDER BY equipment_id, inspected_at DESC
                                  ) s WHERE s.status = 'pending_replacement'),
    'total_rooms',                (SELECT COUNT(*)::int FROM rooms),
    'rooms_not_inspected',        (SELECT COUNT(*)::int FROM rooms r
                                  WHERE EXISTS (SELECT 1 FROM equipment WHERE room_id = r.id)
                                  AND NOT EXISTS (
                                    SELECT 1 FROM equipment_inspections ei
                                    WHERE ei.room_id = r.id
                                    AND ei.inspected_at >= now() - interval '30 days'
                                  )),
    'repairs_pending',            (SELECT COUNT(*)::int FROM repair_requests WHERE status = 'pending'),
    'repairs_in_progress',        (SELECT COUNT(*)::int FROM repair_requests WHERE status = 'in_progress'),
    'repairs_this_month',         (SELECT COUNT(*)::int FROM repair_requests
                                  WHERE created_at >= date_trunc('month', now()))
  )
$$;

-- ─────────────────────────────────────────────
-- 2. ภาพรวมสถานะอุปกรณ์ แยกตามอาคาร
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_equipment_status_summary()
RETURNS TABLE(
  campus_name               text,
  building_name             text,
  total_equipment           bigint,
  status_normal             bigint,
  status_damaged            bigint,
  status_pending_replacement bigint,
  status_unchecked          bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.name::text,
    b.name::text,
    COUNT(e.id),
    COUNT(e.id) FILTER (WHERE latest.status = 'normal'),
    COUNT(e.id) FILTER (WHERE latest.status = 'damaged'),
    COUNT(e.id) FILTER (WHERE latest.status = 'pending_replacement'),
    COUNT(e.id) FILTER (WHERE latest.status IS NULL)
  FROM campuses c
  JOIN buildings b ON b.campus_id = c.id
  JOIN rooms r     ON r.building_id = b.id
  JOIN equipment e ON e.room_id = r.id
  LEFT JOIN LATERAL (
    SELECT status FROM equipment_inspections
    WHERE equipment_id = e.id
    ORDER BY inspected_at DESC
    LIMIT 1
  ) latest ON true
  GROUP BY c.id, c.name, b.id, b.name
  ORDER BY c.name, b.name
$$;

-- ─────────────────────────────────────────────
-- 3. อุปกรณ์ที่สถานะล่าสุด = รอเปลี่ยน
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_equipment_pending_replacement()
RETURNS TABLE(
  equipment_id      uuid,
  equipment_name    text,
  asset_code        text,
  room_code         text,
  building_name     text,
  campus_name       text,
  last_inspected_at timestamptz,
  comment           text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT ON (e.id)
    e.id,
    e.name::text,
    e.asset_code::text,
    r.code::text,
    b.name::text,
    c.name::text,
    ei.inspected_at,
    ei.comment::text
  FROM equipment e
  JOIN rooms r     ON r.id = e.room_id
  JOIN buildings b ON b.id = r.building_id
  JOIN campuses c  ON c.id = b.campus_id
  JOIN equipment_inspections ei ON ei.equipment_id = e.id
  WHERE ei.status = 'pending_replacement'
  ORDER BY e.id, ei.inspected_at DESC
$$;

-- ─────────────────────────────────────────────
-- 4. ห้องที่ยังไม่ได้ตรวจสอบ (ภายใน N วัน)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_rooms_not_inspected(days_threshold int DEFAULT 30)
RETURNS TABLE(
  room_id           uuid,
  room_code         text,
  building_name     text,
  campus_name       text,
  last_inspected_at timestamptz,
  equipment_count   bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    r.id,
    r.code::text,
    b.name::text,
    c.name::text,
    MAX(ei.inspected_at) as last_inspected_at,
    COUNT(DISTINCT e.id) as equipment_count
  FROM rooms r
  JOIN buildings b  ON b.id = r.building_id
  JOIN campuses c   ON c.id = b.campus_id
  JOIN equipment e  ON e.room_id = r.id
  LEFT JOIN equipment_inspections ei ON ei.room_id = r.id
  GROUP BY r.id, r.code, b.id, b.name, c.id, c.name
  HAVING MAX(ei.inspected_at) IS NULL
      OR MAX(ei.inspected_at) < now() - make_interval(days => days_threshold)
  ORDER BY MAX(ei.inspected_at) ASC NULLS FIRST
$$;

-- ─────────────────────────────────────────────
-- 5. สรุปการแจ้งซ่อมรายเดือน (12 เดือนย้อนหลัง)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_repair_monthly()
RETURNS TABLE(
  month       text,
  total       bigint,
  pending     bigint,
  in_progress bigint,
  resolved    bigint,
  closed      bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    to_char(date_trunc('month', created_at), 'YYYY-MM'),
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'in_progress'),
    COUNT(*) FILTER (WHERE status = 'resolved'),
    COUNT(*) FILTER (WHERE status = 'closed')
  FROM repair_requests
  WHERE created_at >= date_trunc('month', now()) - interval '11 months'
  GROUP BY date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at)
$$;

-- ─────────────────────────────────────────────
-- 6. ห้องที่มีการแจ้งซ่อมมากที่สุด
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_rooms_most_repairs(limit_count int DEFAULT 10)
RETURNS TABLE(
  room_code       text,
  building_name   text,
  campus_name     text,
  total_repairs   bigint,
  pending_repairs bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    r.code::text,
    b.name::text,
    c.name::text,
    COUNT(rr.id),
    COUNT(rr.id) FILTER (WHERE rr.status IN ('pending', 'in_progress'))
  FROM rooms r
  JOIN buildings b ON b.id = r.building_id
  JOIN campuses c  ON c.id = b.campus_id
  LEFT JOIN repair_requests rr ON rr.room_id = r.id
  GROUP BY r.id, r.code, b.id, b.name, c.id, c.name
  HAVING COUNT(rr.id) > 0
  ORDER BY COUNT(rr.id) DESC
  LIMIT limit_count
$$;

-- ─────────────────────────────────────────────
-- 7. อุปกรณ์ที่มีการแจ้งซ่อมมากที่สุด
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_equipment_most_repairs(limit_count int DEFAULT 10)
RETURNS TABLE(
  equipment_name  text,
  asset_code      text,
  room_code       text,
  total_repairs   bigint,
  pending_repairs bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    e.name::text,
    e.asset_code::text,
    r.code::text,
    COUNT(rr.id),
    COUNT(rr.id) FILTER (WHERE rr.status IN ('pending', 'in_progress'))
  FROM equipment e
  JOIN rooms r ON r.id = e.room_id
  LEFT JOIN repair_requests rr ON rr.equipment_id = e.id
  GROUP BY e.id, e.name, e.asset_code, r.id, r.code
  HAVING COUNT(rr.id) > 0
  ORDER BY COUNT(rr.id) DESC
  LIMIT limit_count
$$;

-- ─────────────────────────────────────────────
-- 8. คำร้องซ่อมที่ยังค้างอยู่
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_repair_pending()
RETURNS TABLE(
  id             uuid,
  equipment_name text,
  room_code      text,
  building_name  text,
  campus_name    text,
  reported_by    text,
  description    text,
  status         text,
  created_at     timestamptz,
  days_open      bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    rr.id,
    e.name::text,
    r.code::text,
    b.name::text,
    c.name::text,
    COALESCE(rr.reported_by, 'ไม่ระบุ')::text,
    rr.description::text,
    rr.status::text,
    rr.created_at,
    EXTRACT(DAY FROM now() - rr.created_at)::bigint
  FROM repair_requests rr
  JOIN equipment e ON e.id = rr.equipment_id
  JOIN rooms r     ON r.id = rr.room_id
  JOIN buildings b ON b.id = r.building_id
  JOIN campuses c  ON c.id = b.campus_id
  WHERE rr.status IN ('pending', 'in_progress')
  ORDER BY rr.created_at ASC
$$;

-- ─────────────────────────────────────────────
-- 9. ประวัติการตรวจสอบล่าสุด
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpt_inspection_history(limit_count int DEFAULT 30)
RETURNS TABLE(
  inspected_date  date,
  room_code       text,
  building_name   text,
  campus_name     text,
  equipment_count bigint,
  damaged_count   bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ei.inspected_at::date,
    r.code::text,
    b.name::text,
    c.name::text,
    COUNT(ei.id),
    COUNT(ei.id) FILTER (WHERE ei.status != 'normal')
  FROM equipment_inspections ei
  JOIN rooms r     ON r.id = ei.room_id
  JOIN buildings b ON b.id = r.building_id
  JOIN campuses c  ON c.id = b.campus_id
  GROUP BY ei.inspected_at::date, r.id, r.code, b.id, b.name, c.id, c.name
  ORDER BY ei.inspected_at::date DESC
  LIMIT limit_count
$$;

-- ─────────────────────────────────────────────
-- Grant execute to authenticated users
-- ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION rpt_executive_summary()                    TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_equipment_status_summary()             TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_equipment_pending_replacement()        TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_rooms_not_inspected(int)               TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_repair_monthly()                       TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_rooms_most_repairs(int)                TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_equipment_most_repairs(int)            TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_repair_pending()                       TO authenticated;
GRANT EXECUTE ON FUNCTION rpt_inspection_history(int)                TO authenticated;
