# Implementation Plan

## ระบบแสดงสถานะความพร้อมของอุปกรณ์ในห้องเรียน

> อัปเดตล่าสุด: 2026-02-19

---

## Phase 1 — Project Setup & Database ✅

- [x] สร้างโปรเจกต์ Next.js (App Router) + Tailwind CSS + shadcn/ui
- [x] ตั้งค่า Supabase project + environment variables (.env.local)
- [x] สร้าง SQL schema (`supabase/schema.sql`) พร้อม RLS + seed data
- [x] สร้าง `src/lib/supabase.ts` (browser / server / service client)
- [x] สร้าง `src/types/index.ts` (TypeScript interfaces ทั้งหมด)
- [x] สร้าง `src/lib/equipment.ts` (status helpers)
- [x] สร้าง `src/lib/qr.ts` (QR token utilities)
- ⚠️ **TODO:** รัน `supabase/schema.sql` ใน Supabase SQL Editor

---

## Phase 2 — Core Pages & Navigation ✅

- [x] Layout หลัก + Navbar
- [x] `/` Dashboard รวม พร้อม color indicator 🟢🟡🔴⚪
- [x] `/room/[id]` — รายละเอียดห้อง + อุปกรณ์ + ประวัติ + รายการแจ้งซ่อม
- [x] API: `GET /api/dashboard`, `GET /api/equipment`, `GET /api/repairs`, `GET /api/inspections`

---

## Phase 3 — QR Code System ✅

- [x] `src/lib/qr.ts` — สร้าง/จัดการ qr_token
- [x] `GET /api/rooms/[id]/qr` — generate QR Code image
- [x] `POST /api/rooms/[id]/qr` — regenerate token
- [x] `/admin/rooms` — จัดการห้อง, สร้าง QR, regenerate token
- [x] `src/components/qr/QRCodeGenerator.tsx` — แสดง QR + export PNG + พิมพ์
- [x] `/scan/[token]` — landing page (เลือก role)

---

## Phase 4 — Staff Inspection Flow ✅

- [x] `/scan/[token]/inspect` — หน้าตรวจสอบอุปกรณ์ batch ทั้งห้อง
- [x] `src/components/equipment/InspectionForm.tsx`
- [x] `POST /api/inspections` — บันทึกผลตรวจสอบ
- [x] `GET /api/inspections?roomId=` — ประวัติการตรวจสอบ

---

## Phase 5 — Repair Request Flow ✅

- [x] `/scan/[token]/report` — หน้าแจ้งซ่อม (public, ไม่ต้อง login)
  - [x] แสดงรายการอุปกรณ์ในห้อง
  - [x] เลือกอุปกรณ์ที่มีปัญหา (เลือกได้หลายชิ้น)
  - [x] กรอกชื่อผู้แจ้ง, เบอร์โทร, รายละเอียดปัญหา
- [ ] `POST /api/repairs` — สร้างคำแจ้งซ่อม
- [ ] `/admin/repairs` — ติดตามสถานะการซ่อมทั้งหมด
  - [ ] Filter: สถานะ, ห้อง, วันที่
  - [ ] อัปเดตสถานะ: pending → in_progress → resolved → closed
- [ ] `PUT /api/repairs/[id]` — อัปเดตสถานะการซ่อม

---

## Phase 6 — Admin Equipment Management

- [ ] `/admin/equipment` — จัดการอุปกรณ์ทั้งหมด
  - [ ] เพิ่ม / แก้ไข / ลบอุปกรณ์
  - [ ] กำหนด room, type, asset_code, serial_number
- [ ] `GET/POST/PUT/DELETE /api/equipment` — CRUD อุปกรณ์

---

## Phase 7 — Equipment Photo ✅

- [x] เพิ่ม column `photo_url TEXT` ใน `equipment_inspections` (`supabase/migration_photo.sql`)
- [x] `POST /api/inspections/upload` — อัปโหลดรูปไป Supabase Storage bucket `inspection-photos`
- [x] `PhotoCapture` component — camera capture บนมือถือ, preview + ลบได้
- [x] InspectionForm แสดง PhotoCapture เฉพาะเมื่อสถานะ ≠ normal
- [x] แสดงรูปในประวัติการตรวจสอบ (/room/[id])
- ⚠️ **TODO:** รัน `supabase/migration_photo.sql` + สร้าง Storage bucket `inspection-photos`

---

## Phase 8 — LINE Notify ✅

- [x] `src/lib/notify.ts` — `sendLineNotify()` + `buildRepairNotifyMessage()`
- [x] Trigger อัตโนมัติเมื่อ `POST /api/repairs` สำเร็จ (fire-and-forget)
- [x] ข้อความแจ้งเตือน: ห้อง / อาคาร / อุปกรณ์ / ผู้แจ้ง / รายละเอียด
- ⚠️ **TODO:** ใส่ `LINE_NOTIFY_TOKEN` ใน `.env.local` (รับได้ที่ notify-bot.line.me/my/)

---

## Phase 9 — PWA + Local Cache ✅

- [x] ติดตั้ง `@ducanh2912/next-pwa` + Service Worker (`public/sw.js`)
- [x] `public/manifest.json` — app name, theme color, icons
- [x] Layout meta tags สำหรับ iOS PWA (apple-web-app-capable)
- [x] `src/lib/offlineQueue.ts` — offline queue ด้วย localStorage
- [x] `OfflineBanner` component — แสดง status offline / sync
- [x] RepairRequestForm ใช้ offline queue เมื่อ `navigator.onLine === false`
- [x] Auto sync เมื่อสัญญาณกลับมา (`window.online` event)
- ⚠️ **TODO:** เพิ่มไอคอน `/public/icons/icon-192x192.png` และ `icon-512x512.png`

---

## Phase 10 — Testing & Deployment

- [ ] ทดสอบ flow ทั้งหมด (scan → inspect / report)
- [ ] ทดสอบ RLS ว่า role ถูกต้อง
- [ ] ทดสอบ PWA บน Android และ iOS
- [ ] Deploy บน Vercel
- [ ] ตั้งค่า domain `equipment.northbangkok.ac.th`
- [ ] พิมพ์และติด QR Code ในห้องจริง

---

## สรุป Phase

| Phase | หัวข้อ | Priority |
| ----- | ------ | -------- |
| 1 | Project Setup & Database | 🔴 Critical |
| 2 | Core Pages & Navigation | 🔴 Critical |
| 3 | QR Code System | 🔴 Critical |
| 4 | Staff Inspection Flow | 🔴 Critical |
| 5 | Repair Request Flow | 🔴 Critical |
| 6 | Admin Equipment Management | 🔴 Critical |
| 7 | Equipment Photo | 🟡 Important |
| 8 | LINE Notify / Email | 🟡 Important |
| 9 | PWA + Local Cache | 🟡 Important |
| 10 | Testing & Deployment | 🔴 Critical |
