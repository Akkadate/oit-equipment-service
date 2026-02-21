-- Migration 009: Weekly Inspection Report RPC
-- รายงานการตรวจสอบประจำสัปดาห์ — แสดงวันตรวจล่าสุดของทุกห้อง
-- เรียงตาม วิทยาเขต → อาคาร → ชั้น → ห้อง

CREATE OR REPLACE FUNCTION rpt_weekly_inspection()
RETURNS TABLE(
  room_id            uuid,
  campus_name        text,
  building_name      text,
  floor              int,
  room_code          text,
  last_inspected_at  timestamptz,
  room_status        text,
  damaged_count      bigint,
  pending_repl_count bigint,
  pending_repairs    bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH latest_per_eq AS (
    -- สถานะล่าสุดของแต่ละอุปกรณ์
    SELECT DISTINCT ON (equipment_id)
      equipment_id, room_id, status, inspected_at
    FROM equipment_inspections
    ORDER BY equipment_id, inspected_at DESC
  ),
  room_stats AS (
    -- สรุปสถานะรายห้อง
    SELECT
      r.id AS room_id,
      MAX(lpe.inspected_at)                                                           AS last_inspected_at,
      COUNT(CASE WHEN lpe.status = 'damaged'             THEN 1 END)                  AS damaged_count,
      COUNT(CASE WHEN lpe.status = 'pending_replacement' THEN 1 END)                  AS pending_repl_count,
      CASE
        WHEN COUNT(e.id) = 0                                                          THEN 'unchecked'
        WHEN COUNT(lpe.equipment_id) = 0                                              THEN 'unchecked'
        WHEN COUNT(CASE WHEN lpe.status = 'pending_replacement' THEN 1 END) > 0      THEN 'pending_replacement'
        WHEN COUNT(CASE WHEN lpe.status = 'damaged'             THEN 1 END) > 0      THEN 'damaged'
        ELSE 'normal'
      END                                                                             AS room_status
    FROM rooms r
    LEFT JOIN equipment e    ON e.room_id = r.id
    LEFT JOIN latest_per_eq lpe ON lpe.equipment_id = e.id
    GROUP BY r.id
  ),
  repair_counts AS (
    SELECT room_id, COUNT(*) AS cnt
    FROM repair_requests
    WHERE status IN ('pending', 'in_progress')
    GROUP BY room_id
  )
  SELECT
    r.id,
    c.name::text                      AS campus_name,
    b.name::text                      AS building_name,
    r.floor,
    r.code::text                      AS room_code,
    rs.last_inspected_at,
    COALESCE(rs.room_status, 'unchecked')::text AS room_status,
    COALESCE(rs.damaged_count,      0)          AS damaged_count,
    COALESCE(rs.pending_repl_count, 0)          AS pending_repl_count,
    COALESCE(rc.cnt,                0)          AS pending_repairs
  FROM rooms r
  JOIN buildings b ON b.id = r.building_id
  JOIN campuses  c ON c.id = b.campus_id
  LEFT JOIN room_stats   rs ON rs.room_id = r.id
  LEFT JOIN repair_counts rc ON rc.room_id = r.id
  ORDER BY
    c.sort_order, c.name,
    b.sort_order, b.name,
    r.floor NULLS LAST,
    r.sort_order, r.code
$$;
