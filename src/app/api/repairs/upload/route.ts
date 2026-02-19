import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const UPLOAD_DIR =
  process.env.REPAIR_UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads', 'repairs')

const IMAGE_MAX_WIDTH = 1280
const IMAGE_MAX_HEIGHT = 1280
const IMAGE_QUALITY = 80

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const equipmentId = formData.get('equipment_id') as string | null

  if (!file || !equipmentId) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ' }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 20 MB' }, { status: 400 })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  const filename = `${equipmentId}_${Date.now()}.jpg`
  const filepath = path.join(UPLOAD_DIR, filename)

  const inputBuffer = Buffer.from(await file.arrayBuffer())

  await sharp(inputBuffer)
    .rotate()
    .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
    .toFile(filepath)

  const photo_url = `/uploads/repairs/${filename}`
  return NextResponse.json({ photo_url })
}
