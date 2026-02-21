# Migrations Archive

ไฟล์ในโฟลเดอร์นี้คือ migration ที่เคยรันแยกกันระหว่างการพัฒนา
**เก็บไว้เป็น historical record เท่านั้น — ไม่ต้องรันอีก**

ถ้าติดตั้งใหม่ ให้ใช้ `../schema.sql` แทน เพราะรวม column ทั้งหมดไว้แล้ว

---

| ไฟล์ | เพิ่มเมื่อ | สิ่งที่เปลี่ยน |
| ---- | --------- | -------------- |
| `001_inspection_photo.sql` | Phase 1 | เพิ่ม `photo_url` ใน `equipment_inspections` |
| `002_equipment_retire.sql` | Phase 1 | เพิ่ม `retired_at` + index ใน `equipment` |
| `003_repair_resolved_by.sql` | Phase 1 | เพิ่ม `resolved_by` ใน `repair_requests` |
| `004_repair_photo.sql` | Phase 1 | เพิ่ม `photo_url` ใน `repair_requests` |
| `005_campus_sort_order.sql` | Phase 1 | เพิ่ม `sort_order` ใน `campuses` |
| `006_push_subscriptions.sql` | Phase 2 | สร้างตาราง `push_subscriptions` สำหรับ Web Push (PWA) |
| `007_report_functions.sql` | Phase 2 | สร้าง SQL RPC functions 9 ฟังก์ชันสำหรับหน้ารายงาน |
| `008_building_room_sort_order.sql` | Phase 2 | เพิ่ม `sort_order` ใน `buildings` และ `rooms` |
| `009_weekly_inspection_report.sql` | Phase 2 | สร้าง `rpt_weekly_inspection()` สำหรับรายงานประจำสัปดาห์ |

---

**สำหรับฐานข้อมูลที่ใช้งานอยู่แล้ว** และต้องการ apply เพิ่มเติม
ให้รันทีละไฟล์ตามลำดับเลขนำหน้า ใน Supabase SQL Editor
(ทุก statement ใช้ `IF NOT EXISTS` หรือ `CREATE OR REPLACE` จึงปลอดภัยหากรันซ้ำ)

## Report Functions (Migration 007)

| Function | คำอธิบาย |
| -------- | -------- |
| `rpt_executive_summary()` | ตัวเลขสรุปภาพรวมทั้งหมด |
| `rpt_equipment_status_summary()` | สถานะอุปกรณ์แยกตามอาคาร |
| `rpt_equipment_pending_replacement()` | รายการอุปกรณ์รอเปลี่ยน |
| `rpt_rooms_not_inspected(days_threshold)` | ห้องที่ยังไม่ตรวจสอบภายใน N วัน |
| `rpt_repair_monthly()` | การแจ้งซ่อมรายเดือน |
| `rpt_rooms_most_repairs(limit_count)` | ห้องที่แจ้งซ่อมบ่อยที่สุด |
| `rpt_equipment_most_repairs(limit_count)` | อุปกรณ์ที่แจ้งซ่อมบ่อยที่สุด |
| `rpt_repair_pending()` | คำร้องซ่อมที่ยังค้างอยู่ |
| `rpt_inspection_history(limit_count)` | ประวัติการตรวจสอบล่าสุด |

## Weekly Inspection Report (Migration 009)

| Function | คำอธิบาย |
| -------- | -------- |
| `rpt_weekly_inspection()` | วันตรวจสอบล่าสุดของทุกห้อง พร้อมสถานะและจำนวนแจ้งซ่อมค้าง เรียงตาม วิทยาเขต → อาคาร → ชั้น → ห้อง |
