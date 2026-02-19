import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getRoomByToken(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/scan/${token}`,
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
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
    </div>
  )
}
