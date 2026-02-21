import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendTelegramNotify, buildRepairNotifyMessage } from '@/lib/notify'
import { sendPushToAll } from '@/lib/webpush'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const status = searchParams.get('status')
  const supabase = createServiceClient()

  let query = supabase
    .from('repair_requests')
    .select(`
      id, reported_by, reporter_phone, description, status, resolved_note, resolved_by, photo_url, created_at, updated_at,
      equipment:equipment ( id, name, asset_code ),
      room:rooms ( id, code, name, building:buildings ( id, code, name, campus:campuses ( id, name, sort_order ) ) )
    `)
    .order('created_at', { ascending: false })

  if (roomId) query = query.eq('room_id', roomId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { equipment_id, room_id, reported_by, reporter_phone, description, photo_url } = body

  if (!equipment_id || !room_id || !reported_by || !description) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('repair_requests')
    .insert({ equipment_id, room_id, reported_by, reporter_phone, description, photo_url: photo_url || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ดึงข้อมูลห้องและอุปกรณ์เพื่อส่ง LINE Notify
  const supabaseForNotify = createServiceClient()
  const { data: eqData } = await supabaseForNotify
    .from('equipment')
    .select('name, asset_code, room:rooms(code, building:buildings(name, campus:campuses(name)))')
    .eq('id', equipment_id)
    .single()

  if (eqData) {
    const room = (eqData as any).room
    const building = room?.building
    const campus = building?.campus
    const msg = buildRepairNotifyMessage({
      roomCode: room?.code ?? '-',
      buildingName: building?.name ?? '-',
      campusName: campus?.name ?? '-',
      equipmentName: eqData.name,
      assetCode: eqData.asset_code,
      reportedBy: reported_by,
      reporterPhone: reporter_phone,
      description,
    })
    // await ทั้งคู่เพื่อให้ส่งได้ก่อน serverless process ถูกยกเลิก
    await Promise.allSettled([
      sendTelegramNotify(msg),
      sendPushToAll({
        title: `🔧 แจ้งซ่อม · ห้อง ${room?.code ?? ''}`,
        body: `${eqData.name} — ${description}`,
        url: '/admin/repairs',
      }),
    ])
  }

  return NextResponse.json(data, { status: 201 })
}
