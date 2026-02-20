-- Migration: เพิ่มฟิลด์ retired_at สำหรับบันทึกวันที่จำหน่ายออก
-- รันใน Supabase SQL Editor

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: index สำหรับ query อุปกรณ์ที่ยังใช้งานอยู่
CREATE INDEX IF NOT EXISTS equipment_retired_at_idx ON equipment (retired_at);
