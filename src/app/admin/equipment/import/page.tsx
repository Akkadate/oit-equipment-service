import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Navbar } from '@/components/shared/Navbar'
import { ImportClient } from './ImportClient'

export const dynamic = 'force-dynamic'

export default async function EquipmentImportPage() {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login?next=/admin/equipment/import')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 sm:px-5 pt-5 pb-16">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/equipment" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
              จัดการอุปกรณ์
            </Link>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-600">นำเข้าจาก CSV</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">นำเข้าอุปกรณ์จาก CSV</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            รองรับวันที่: dd/mm/yyyy · dd-mm-yyyy · yyyy-mm-dd · ถ้า asset_code ซ้ำจะข้ามแถวนั้น
          </p>
        </div>

        {/* Template download */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-400 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-0.5">รูปแบบ CSV ที่ใช้ได้</p>
            <code className="bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">
              building_code,room_code,type_name,name,asset_code,serial_number,installed_at,note
            </code>
            <p className="mt-1 text-blue-600">ตัวอย่าง: <code className="bg-blue-100 px-1 rounded">NT-B2,N2401,โปรเจกเตอร์,โปรเจกเตอร์ EPSON EB-X51,NBU3-1,SN001,23/02/2026,</code></p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <ImportClient />
        </div>
      </main>
    </div>
  )
}
