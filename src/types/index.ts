export interface Campus {
  id: string
  code: string
  name: string
  created_at: string
}

export interface Building {
  id: string
  campus_id: string
  code: string
  name: string
  created_at: string
  campus?: Campus
}

export interface Room {
  id: string
  building_id: string
  code: string
  name?: string
  floor?: number
  qr_token: string
  created_at: string
  building?: Building
  // computed
  status?: RoomStatus
  last_inspected_at?: string
  equipment_count?: number
}

export interface EquipmentType {
  id: number
  name: string
}

export interface Equipment {
  id: string
  room_id: string
  type_id: number
  name: string
  asset_code: string
  serial_number?: string
  installed_at?: string
  note?: string
  created_at: string
  equipment_type?: EquipmentType
  // computed from latest inspection
  latest_status?: EquipmentStatus
  latest_comment?: string
  latest_inspected_at?: string
}

export type EquipmentStatus = 'normal' | 'damaged' | 'pending_replacement'
export type RoomStatus = 'normal' | 'damaged' | 'pending_replacement' | 'unchecked'
export type RepairStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

export interface EquipmentInspection {
  id: string
  equipment_id: string
  room_id: string
  inspected_by: string
  status: EquipmentStatus
  comment?: string
  inspected_at: string
  equipment?: Equipment
}

export interface RepairRequest {
  id: string
  equipment_id: string
  room_id: string
  reported_by: string
  reporter_phone?: string
  description: string
  status: RepairStatus
  resolved_note?: string
  created_at: string
  updated_at: string
  equipment?: Equipment
  room?: Room
}

// Dashboard summary types
export interface RoomSummary extends Room {
  status: RoomStatus
  last_inspected_at?: string
  equipment_count: number
  pending_repairs: number
}

export interface BuildingSummary extends Building {
  rooms: RoomSummary[]
  total_rooms: number
  rooms_normal: number
  rooms_damaged: number
  rooms_critical: number
  rooms_unchecked: number
}

export interface CampusSummary extends Campus {
  buildings: BuildingSummary[]
}

// API request/response types
export interface InspectionSubmit {
  room_id: string
  inspections: {
    equipment_id: string
    status: EquipmentStatus
    comment?: string
  }[]
}

export interface RepairRequestSubmit {
  equipment_id: string
  room_id: string
  reported_by: string
  reporter_phone?: string
  description: string
}

export interface ScanPageData {
  room: Room & {
    building: Building & {
      campus: Campus
    }
  }
  equipment: Equipment[]
}

export type UserRole = 'admin' | 'staff' | 'user'
