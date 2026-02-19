import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('equipment_types')
    .select('id, name')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'กรุณาระบุชื่อประเภท' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('equipment_types')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
