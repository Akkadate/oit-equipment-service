-- Migration: เพิ่ม photo_url ใน equipment_inspections
-- รูปเก็บบน server เอง (local filesystem) ไม่ใช้ Supabase Storage
ALTER TABLE equipment_inspections ADD COLUMN IF NOT EXISTS photo_url TEXT;
