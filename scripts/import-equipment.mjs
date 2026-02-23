// scripts/import-equipment.mjs
// รัน: node scripts/import-equipment.mjs

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// อ่าน .env.local
const envText = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ไม่พบ SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// แปลง dd/m/yyyy หรือ dd/mm/yyyy → yyyy-mm-dd
function parseDate(s) {
  if (!s || !s.trim()) return null
  const parts = s.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// อ่าน CSV
function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]))
  }).filter(r => r.building_code && r.room_code && r.name && r.asset_code)
}

async function main() {
  const csvPath = path.join(__dirname, '..', 'room-with-remote.csv')
  const text = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCsv(text)
  console.log(`📋 พบ ${rows.length} แถว`)

  // ดึง buildings + rooms + equipment_types
  const [bRes, rRes, tRes] = await Promise.all([
    supabase.from('buildings').select('id, code'),
    supabase.from('rooms').select('id, code, building_id'),
    supabase.from('equipment_types').select('id, name'),
  ])

  if (bRes.error) { console.error('❌ buildings:', bRes.error.message); process.exit(1) }
  if (rRes.error) { console.error('❌ rooms:', rRes.error.message); process.exit(1) }
  if (tRes.error) { console.error('❌ equipment_types:', tRes.error.message); process.exit(1) }

  console.log(`🏢 ${bRes.data.length} อาคาร, 🚪 ${rRes.data.length} ห้อง, 🏷️ ${tRes.data.length} ประเภท`)

  const buildingMap = new Map(bRes.data.map(b => [b.code, b.id]))
  const roomMap = new Map(rRes.data.map(r => [`${r.building_id}::${r.code}`, r.id]))
  const typeMap = new Map(tRes.data.map(t => [t.name, t.id]))

  let ok = 0, skip = 0, errors = []

  for (const row of rows) {
    const buildingId = buildingMap.get(row.building_code)
    if (!buildingId) { errors.push(`ไม่เจออาคาร: ${row.building_code}`); skip++; continue }

    const roomId = roomMap.get(`${buildingId}::${row.room_code}`)
    if (!roomId) { errors.push(`ไม่เจอห้อง: ${row.building_code}/${row.room_code}`); skip++; continue }

    let typeId = typeMap.get(row.type_name) ?? null

    // ถ้าไม่มี type → สร้างใหม่
    if (!typeId && row.type_name) {
      const { data: newType, error: typeErr } = await supabase
        .from('equipment_types').insert({ name: row.type_name }).select('id').single()
      if (!typeErr) { typeId = newType.id; typeMap.set(row.type_name, typeId) }
    }

    const { error } = await supabase.from('equipment').insert({
      room_id: roomId,
      type_id: typeId,
      name: row.name,
      asset_code: row.asset_code,
      serial_number: row.serial_number || null,
      installed_at: parseDate(row.installed_at),
      note: row.note || null,
    })

    if (error) {
      if (error.code === '23505') { // duplicate asset_code
        errors.push(`ซ้ำ asset_code: ${row.asset_code}`)
        skip++
      } else {
        errors.push(`error ${row.asset_code}: ${error.message}`)
        skip++
      }
    } else {
      ok++
      if (ok % 50 === 0) console.log(`  ✓ ${ok} รายการแล้ว...`)
    }
  }

  console.log(`\n✅ สำเร็จ: ${ok} รายการ`)
  if (skip > 0) {
    console.log(`⚠️  ข้ามไป: ${skip} รายการ`)
    errors.slice(0, 20).forEach(e => console.log('   -', e))
    if (errors.length > 20) console.log(`   ... และอีก ${errors.length - 20} รายการ`)
  }
}

main().catch(console.error)
