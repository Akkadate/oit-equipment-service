import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateQRDataURL } from '@/lib/qr'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, code, name, qr_token, building:buildings(code, name, campus:campuses(code, name))')
    .eq('id', id)
    .single()

  if (error || !room) {
    return NextResponse.json({ error: 'ไม่พบห้อง' }, { status: 404 })
  }

  const dataUrl = await generateQRDataURL((room as any).qr_token)
  return NextResponse.json({ dataUrl, room })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  // Regenerate QR token
  const newToken = crypto.randomUUID()
  const { data, error } = await supabase
    .from('rooms')
    .update({ qr_token: newToken })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
