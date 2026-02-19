import { Navbar } from '@/components/shared/Navbar'
import { CampusManager } from './CampusManager'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getCampuses() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('campuses').select('*').order('name')
  return data ?? []
}

export default async function AdminCampusesPage() {
  const campuses = await getCampuses()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">จัดการวิทยาเขต</h1>
          <p className="text-sm text-gray-500 mt-1">รวม {campuses.length} วิทยาเขต</p>
        </div>
        <CampusManager campuses={campuses} />
      </main>
    </div>
  )
}
