import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

interface ImportItem {
  room_id: string
  type_id: number
  name: string
  asset_code: string
  serial_number?: string | null
  installed_at?: string | null
  note?: string | null
}

export async function POST(req: NextRequest) {
  const { items } = await req.json() as { items: ImportItem[] }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะนำเข้า' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('equipment')
    .insert(items)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ imported: data?.length ?? 0 })
}
