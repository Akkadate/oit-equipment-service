import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const campusId = searchParams.get('campusId')

  let query = supabase
    .from('buildings')
    .select('*, campus:campuses(id, code, name)')
    .order('name')

  if (campusId) query = query.eq('campus_id', campusId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('buildings')
    .insert({ campus_id: body.campusId, code: body.code, name: body.name })
    .select('*, campus:campuses(id, code, name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
