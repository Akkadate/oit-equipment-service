import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// ── CSV helpers ────────────────────────────────────────────────────────────
function escapeCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function toCsv(headers: string[], rows: Record<string, unknown>[], keys: string[]): string {
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => keys.map((k) => escapeCell(row[k])).join(',')),
  ]
  return '\uFEFF' + lines.join('\r\n') // BOM → Excel เปิดภาษาไทยได้ถูกต้อง
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Report definitions ─────────────────────────────────────────────────────
type ReportDef = {
  rpc: string
  rpcArgs?: Record<string, unknown>
  filename: string
  headers: string[]
  keys: string[]
}

const REPORTS: Record<string, ReportDef> = {
  'status-summary': {
    rpc: 'rpt_equipment_status_summary',
    filename: 'สถานะอุปกรณ์ตามอาคาร',
    headers: ['วิทยาเขต', 'อาคาร', 'ทั้งหมด', 'ปกติ', 'ชำรุด', 'รอเปลี่ยน', 'ยังไม่ตรวจ'],
    keys: ['campus_name', 'building_name', 'total_equipment', 'status_normal', 'status_damaged', 'status_pending_replacement', 'status_unchecked'],
  },
  'pending-replacement': {
    rpc: 'rpt_equipment_pending_replacement',
    filename: 'อุปกรณ์รอเปลี่ยน',
    headers: ['รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'ห้อง', 'อาคาร', 'วิทยาเขต', 'ตรวจสอบล่าสุด', 'หมายเหตุ'],
    keys: ['asset_code', 'equipment_name', 'room_code', 'building_name', 'campus_name', 'last_inspected_at', 'comment'],
  },
  'not-inspected': {
    rpc: 'rpt_rooms_not_inspected',
    rpcArgs: { days_threshold: 30 },
    filename: 'ห้องยังไม่ตรวจสอบ',
    headers: ['ห้อง', 'อาคาร', 'วิทยาเขต', 'จำนวนอุปกรณ์', 'ตรวจสอบล่าสุด'],
    keys: ['room_code', 'building_name', 'campus_name', 'equipment_count', 'last_inspected_at'],
  },
  'repair-monthly': {
    rpc: 'rpt_repair_monthly',
    filename: 'การแจ้งซ่อมรายเดือน',
    headers: ['เดือน', 'รวม', 'รอดำเนินการ', 'กำลังดำเนินการ', 'แก้ไขแล้ว', 'ปิด'],
    keys: ['month', 'total', 'pending', 'in_progress', 'resolved', 'closed'],
  },
  'rooms-most-repairs': {
    rpc: 'rpt_rooms_most_repairs',
    rpcArgs: { limit_count: 50 },
    filename: 'ห้องแจ้งซ่อมบ่อย',
    headers: ['ห้อง', 'อาคาร', 'วิทยาเขต', 'แจ้งซ่อมทั้งหมด', 'ค้างอยู่'],
    keys: ['room_code', 'building_name', 'campus_name', 'total_repairs', 'pending_repairs'],
  },
  'equipment-most-repairs': {
    rpc: 'rpt_equipment_most_repairs',
    rpcArgs: { limit_count: 50 },
    filename: 'อุปกรณ์แจ้งซ่อมบ่อย',
    headers: ['รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'ห้อง', 'แจ้งซ่อมทั้งหมด', 'ค้างอยู่'],
    keys: ['asset_code', 'equipment_name', 'room_code', 'total_repairs', 'pending_repairs'],
  },
  'repair-pending': {
    rpc: 'rpt_repair_pending',
    filename: 'คำร้องซ่อมค้างอยู่',
    headers: ['อุปกรณ์', 'ห้อง', 'อาคาร', 'วิทยาเขต', 'ผู้แจ้ง', 'รายละเอียด', 'สถานะ', 'วันที่แจ้ง', 'ค้างมา(วัน)'],
    keys: ['equipment_name', 'room_code', 'building_name', 'campus_name', 'reported_by', 'description', 'status', 'created_at', 'days_open'],
  },
  'inspection-history': {
    rpc: 'rpt_inspection_history',
    rpcArgs: { limit_count: 500 },
    filename: 'ประวัติการตรวจสอบ',
    headers: ['วันที่', 'ห้อง', 'อาคาร', 'วิทยาเขต', 'อุปกรณ์ที่ตรวจ', 'พบปัญหา'],
    keys: ['inspected_date', 'room_code', 'building_name', 'campus_name', 'equipment_count', 'damaged_count'],
  },
  'weekly-inspection': {
    rpc: 'rpt_weekly_inspection',
    filename: 'ตรวจสอบประจำสัปดาห์',
    headers: ['วิทยาเขต', 'อาคาร', 'ชั้น', 'ห้อง', 'ตรวจสอบล่าสุด', 'สถานะ', 'ชำรุด(รายการ)', 'รอเปลี่ยน(รายการ)', 'แจ้งซ่อมค้าง'],
    keys: ['campus_name', 'building_name', 'floor', 'room_code', 'last_inspected_at', 'room_status', 'damaged_count', 'pending_repl_count', 'pending_repairs'],
  },
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  // Auth check
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await params
  const def = REPORTS[type]
  if (!def) return NextResponse.json({ error: 'ไม่พบรายงานนี้' }, { status: 404 })

  // Fetch data
  const db = createServiceClient()
  const { data, error } = await db.rpc(def.rpc, def.rpcArgs ?? {})
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data as Record<string, unknown>[]) ?? []
  const csv = toCsv(def.headers, rows, def.keys)
  const filename = `${def.filename}-${today()}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
