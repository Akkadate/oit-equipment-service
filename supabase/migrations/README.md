# Migrations Archive

ไฟล์ในโฟลเดอร์นี้คือ migration ที่เคยรันแยกกันระหว่างการพัฒนา
**เก็บไว้เป็น historical record เท่านั้น — ไม่ต้องรันอีก**

ถ้าติดตั้งใหม่ ให้ใช้ `../schema.sql` แทน เพราะรวม column ทั้งหมดไว้แล้ว

---

| ไฟล์ | เพิ่มเมื่อ | สิ่งที่เปลี่ยน |
|------|-----------|----------------|
| `001_inspection_photo.sql` | Phase 1 | เพิ่ม `photo_url` ใน `equipment_inspections` |
| `002_equipment_retire.sql` | Phase 1 | เพิ่ม `retired_at` + index ใน `equipment` |
| `003_repair_resolved_by.sql` | Phase 1 | เพิ่ม `resolved_by` ใน `repair_requests` |
| `004_repair_photo.sql` | Phase 1 | เพิ่ม `photo_url` ใน `repair_requests` |
| `005_campus_sort_order.sql` | Phase 1 | เพิ่ม `sort_order` ใน `campuses` |

---

**สำหรับฐานข้อมูลที่ใช้งานอยู่แล้ว** และต้องการ apply เพิ่มเติม
ให้รันทีละไฟล์ตามลำดับเลขนำหน้า ใน Supabase SQL Editor
(ทุก statement ใช้ `IF NOT EXISTS` จึงปลอดภัยหากรันซ้ำ)
