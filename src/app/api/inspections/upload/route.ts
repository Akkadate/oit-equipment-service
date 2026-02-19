import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

// เก็บรูปใน public/uploads/inspections/ → Next.js serve เป็น static file อัตโนมัติ
// กำหนด UPLOAD_DIR ใน .env เพื่อ mount ไปยัง volume อื่นได้
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads', 'inspections')

// ตั้งค่าการย่อรูป
const IMAGE_MAX_WIDTH = 1280   // px — พอดีจอมือถือ HD
const IMAGE_MAX_HEIGHT = 1280  // px
const IMAGE_QUALITY = 80       // JPEG quality 0-100

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

  // จำกัดขนาดไฟล์ต้นฉบับ 20 MB (ก่อนย่อ)
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 20 MB' }, { status: 400 })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  // บันทึกเป็น .jpg เสมอ (หลังแปลง + ย่อ)
  const filename = `${equipmentId}_${Date.now()}.jpg`
  const filepath = path.join(UPLOAD_DIR, filename)

  const inputBuffer = Buffer.from(await file.arrayBuffer())

  // ย่อรูป + แปลงเป็น JPEG ด้วย sharp
  await sharp(inputBuffer)
    .rotate()                          // auto-rotate จาก EXIF (กล้องมือถือ)
    .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
      fit: 'inside',                   // คงสัดส่วน ไม่ crop
      withoutEnlargement: true,        // ไม่ขยายถ้าเล็กกว่า limit
    })
    .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
    .toFile(filepath)

  const photo_url = `/uploads/inspections/${filename}`
  return NextResponse.json({ photo_url })
}
