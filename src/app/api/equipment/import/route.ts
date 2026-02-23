import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type ImportRow = {
  building_code: string
  room_code: string
  type_name: string
  name: string
  asset_code: string
  serial_number?: string
  installed_at?: string | null
  note?: string
}

export async function POST(req: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows }: { rows: ImportRow[] } = await req.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'ไม่มีข้อมูล' }, { status: 400 })
  }

  const db = createServiceClient()
  const [{ data: buildings }, { data: rooms }, { data: types }] = await Promise.all([
    db.from('buildings').select('id, code'),
    db.from('rooms').select('id, code, building_id'),
    db.from('equipment_types').select('id, name'),
  ])

  const buildingMap = new Map((buildings ?? []).map((b: any) => [b.code, b.id]))
  const roomMap = new Map((rooms ?? []).map((r: any) => [`${r.building_id}::${r.code}`, r.id]))
  const typeMap = new Map((types ?? []).map((t: any) => [t.name, t.id]))

  let ok = 0, skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const buildingId = buildingMap.get(row.building_code)
    if (!buildingId) {
      errors.push(`ไม่เจออาคาร "${row.building_code}" (${row.asset_code})`)
      skipped++; continue
    }

    const roomId = roomMap.get(`${buildingId}::${row.room_code}`)
    if (!roomId) {
      errors.push(`ไม่เจอห้อง "${row.room_code}" ในอาคาร "${row.building_code}" (${row.asset_code})`)
      skipped++; continue
    }

    let typeId: number | null = (typeMap.get(row.type_name) as number) ?? null
    if (!typeId && row.type_name) {
      const { data: newType } = await db.from('equipment_types').insert({ name: row.type_name }).select('id').single()
      if (newType) { typeId = (newType as any).id; typeMap.set(row.type_name, typeId) }
    }

    const { error } = await db.from('equipment').insert({
      room_id: roomId,
      type_id: typeId,
      name: row.name,
      asset_code: row.asset_code,
      serial_number: row.serial_number || null,
      installed_at: row.installed_at || null,
      note: row.note || null,
    })

    if (error) {
      if (error.code === '23505') { errors.push(`รหัส asset ซ้ำ: ${row.asset_code}`); skipped++ }
      else { errors.push(`${row.asset_code}: ${error.message}`); skipped++ }
    } else {
      ok++
    }
  }

  return NextResponse.json({ ok, skipped, errors })
}
