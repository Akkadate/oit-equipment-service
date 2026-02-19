import { Navbar } from '@/components/shared/Navbar'
import { EquipmentTypeManager } from './EquipmentTypeManager'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getTypes() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('equipment_types').select('id, name').order('name')
  return data ?? []
}

export default async function AdminEquipmentTypesPage() {
  const types = await getTypes()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">จัดการประเภทอุปกรณ์</h1>
          <p className="text-sm text-gray-500 mt-1">รวม {types.length} ประเภท</p>
        </div>
        <EquipmentTypeManager types={types} />
      </main>
    </div>
  )
}
