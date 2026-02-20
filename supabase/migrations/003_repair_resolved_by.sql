-- เพิ่มคอลัมน์ resolved_by เพื่อบันทึกชื่อเจ้าหน้าที่ที่ดำเนินการซ่อม
ALTER TABLE repair_requests
  ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(150);
