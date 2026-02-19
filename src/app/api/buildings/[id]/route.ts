import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServiceClient()
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabase
    .from('buildings')
    .update({ campus_id: body.campusId, code: body.code, name: body.name })
    .eq('id', id)
    .select('*, campus:campuses(id, code, name)')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServiceClient()
  const { id } = await params
  const { error } = await supabase.from('buildings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
