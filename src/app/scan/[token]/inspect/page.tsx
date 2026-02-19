import Link from 'next/link'
import { InspectionForm } from '@/components/equipment/InspectionForm'

async function getScanData(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/scan/${token}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function InspectPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getScanData(token)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">ไม่พบห้องนี้</p>
      </div>
    )
  }

  const campus = data.building?.campus
  const building = data.building

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/scan/${token}`} className="text-gray-400 hover:text-gray-600">
          ←
        </Link>
        <div>
          <h1 className="font-semibold text-gray-900">
            ตรวจสอบอุปกรณ์ — ห้อง {data.code}
          </h1>
          <p className="text-xs text-gray-400">
            {campus?.name} · {building?.name}
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {data.equipment?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            ห้องนี้ยังไม่มีอุปกรณ์ในระบบ
          </div>
        ) : (
          <InspectionForm
            equipment={data.equipment}
            roomId={data.id}
            token={token}
          />
        )}
      </main>
    </div>
  )
}
