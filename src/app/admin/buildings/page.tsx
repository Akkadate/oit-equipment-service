import { Navbar } from '@/components/shared/Navbar'
import { BuildingManager } from './BuildingManager'
import { createServiceClient } from '@/lib/supabase'

async function getData() {
  const supabase = createServiceClient()
  const [{ data: buildings }, { data: campuses }] = await Promise.all([
    supabase.from('buildings').select('*, campus:campuses(id, code, name)').order('name'),
    supabase.from('campuses').select('*').order('name'),
  ])
  return { buildings: buildings ?? [], campuses: campuses ?? [] }
}

export default async function AdminBuildingsPage() {
  const { buildings, campuses } = await getData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">จัดการอาคาร</h1>
          <p className="text-sm text-gray-500 mt-1">รวม {buildings.length} อาคาร</p>
        </div>
        <BuildingManager buildings={buildings as any} campuses={campuses} />
      </main>
    </div>
  )
}
