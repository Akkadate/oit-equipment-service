import { RoomStatus, EquipmentStatus } from '@/types'

// ใช้สำหรับ server-side fetch เรียก API ตัวเอง ผ่าน localhost แทน public domain
export function internalUrl(path: string): string {
  const port = process.env.PORT ?? '3001'
  return `http://localhost:${port}${path}`
}

// คำนวณสถานะห้องจากสถานะอุปกรณ์ทั้งหมด
export function calcRoomStatus(statuses: EquipmentStatus[]): RoomStatus {
  if (statuses.length === 0) return 'unchecked'
  if (statuses.includes('pending_replacement')) return 'pending_replacement'
  if (statuses.includes('damaged')) return 'damaged'
  return 'normal'
}

// Map สถานะเป็น label ภาษาไทย
export const statusLabel: Record<RoomStatus | EquipmentStatus, string> = {
  normal: 'ปกติ',
  damaged: 'ชำรุด',
  pending_replacement: 'รอเปลี่ยน',
  unchecked: 'ยังไม่ตรวจ',
}

// Map สถานะเป็น color class
export const statusColor: Record<RoomStatus, string> = {
  normal: 'bg-green-500',
  damaged: 'bg-yellow-500',
  pending_replacement: 'bg-red-500',
  unchecked: 'bg-gray-400',
}

export const statusBadgeVariant: Record<RoomStatus | EquipmentStatus, string> = {
  normal: 'bg-green-100 text-green-800',
  damaged: 'bg-yellow-100 text-yellow-800',
  pending_replacement: 'bg-red-100 text-red-800',
  unchecked: 'bg-gray-100 text-gray-600',
}

export const statusDot: Record<RoomStatus, string> = {
  normal: '🟢',
  damaged: '🟡',
  pending_replacement: '🔴',
  unchecked: '⚪',
}

export const repairStatusLabel: Record<string, string> = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังซ่อม',
  resolved: 'ซ่อมแล้ว',
  closed: 'ปิดงาน',
}

export const repairStatusColor: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}
