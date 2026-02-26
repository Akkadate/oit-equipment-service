import Link from 'next/link'
import { internalUrl } from '@/lib/equipment'
import { ChatbotWidget } from '@/components/shared/ChatbotWidget'

function shortDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return 'วันนี้'
  if (days === 1) return 'เมื่อวาน'
  if (days < 7) return `${days} วันก่อน`
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

async function getRoomByToken(token: string) {
  const res = await fetch(
    internalUrl(`/api/scan/${token}`),
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function ScanLandingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getRoomByToken(token)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-800">ไม่พบห้องนี้</h1>
          <p className="text-gray-500 mt-2 text-sm">QR Code อาจหมดอายุหรือไม่ถูกต้อง</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    )
  }

  const { room, building, campus } = {
    room: data,
    building: data.building,
    campus: data.building?.campus,
  }

  const activeRepairs: any[] = data.active_repairs ?? []
  const hasRepairs = activeRepairs.length > 0

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center px-4 ${hasRepairs ? 'py-8' : 'justify-center'}`}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-6 space-y-6">
        {/* Room info */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">
            {campus?.name} · {building?.name}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">ห้อง {room.code}</h1>
          {room.name && <p className="text-gray-500 text-sm mt-1">{room.name}</p>}
          {room.floor && (
            <p className="text-gray-400 text-xs mt-1">ชั้น {room.floor}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            อุปกรณ์ {data.equipment?.length ?? 0} รายการ
          </p>
        </div>

        {/* Role selection */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600 font-medium">
            คุณต้องการทำอะไร?
          </p>

          <Link
            href={`/scan/${token}/report`}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-medium transition-colors"
          >
            🔧 แจ้งซ่อมอุปกรณ์
            <p className="text-xs font-normal opacity-80 mt-0.5">สำหรับอาจารย์ / ผู้ใช้ทั่วไป</p>
          </Link>

          <Link
            href={`/scan/${token}/inspect`}
            className="block w-full bg-gray-800 hover:bg-gray-900 text-white text-center py-3 rounded-xl font-medium transition-colors"
          >
            ✅ ตรวจสอบอุปกรณ์
            <p className="text-xs font-normal opacity-80 mt-0.5">สำหรับเจ้าหน้าที่ IT</p>
          </Link>
        </div>
      </div>

      {/* Active repairs — shown below the card when present */}
      {hasRepairs && (
        <div className="w-full max-w-sm mt-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">🔧 แจ้งซ่อมค้างอยู่</span>
            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeRepairs.length}
            </span>
          </div>
          {activeRepairs.map((r) => (
            <div key={r.id} className="bg-white border border-orange-100 rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'pending'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {r.status === 'pending' ? 'รอดำเนินการ' : 'กำลังซ่อม'}
                </span>
                <span className="text-sm font-medium text-gray-800 truncate">{r.equipment?.name}</span>
              </div>
              <p className="text-sm text-gray-600">{r.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                แจ้งโดย {r.reported_by} · {shortDate(r.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chatbot floating widget */}
      <ChatbotWidget />
    </div>
  )
}
