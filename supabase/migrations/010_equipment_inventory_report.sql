-- Migration 010: Equipment Inventory Report RPC
-- รายการอุปกรณ์ทั้งหมด พร้อมข้อมูลที่ตั้ง เรียงตาม วิทยาเขต → อาคาร → ชั้น → ห้อง

CREATE OR REPLACE FUNCTION rpt_equipment_inventory()
RETURNS TABLE(
  equipment_id   uuid,
  campus_name    text,
  building_name  text,
  floor          int,
  room_code      text,
  type_name      text,
  equipment_name text,
  asset_code     text,
  serial_number  text,
  installed_at   date
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    e.id                                  AS equipment_id,
    c.name::text                          AS campus_name,
    b.name::text                          AS building_name,
    r.floor,
    r.code::text                          AS room_code,
    COALESCE(et.name, '')::text           AS type_name,
    e.name::text                          AS equipment_name,
    e.asset_code::text,
    COALESCE(e.serial_number, '')::text   AS serial_number,
    e.installed_at
  FROM equipment e
  JOIN rooms r          ON r.id  = e.room_id
  JOIN buildings b      ON b.id  = r.building_id
  JOIN campuses c       ON c.id  = b.campus_id
  LEFT JOIN equipment_types et ON et.id = e.type_id
  WHERE e.retired_at IS NULL
  ORDER BY
    c.sort_order, c.name,
    b.sort_order, b.name,
    r.floor NULLS LAST,
    r.sort_order, r.code,
    e.name
$$;
