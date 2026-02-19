'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/admin/campuses', label: 'วิทยาเขต' },
  { href: '/admin/buildings', label: 'อาคาร' },
  { href: '/admin/rooms', label: 'ห้องเรียน / QR' },
  { href: '/admin/equipment', label: 'อุปกรณ์' },
  { href: '/admin/equipment-types', label: 'ประเภทอุปกรณ์' },
  { href: '/admin/repairs', label: 'แจ้งซ่อม' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-semibold text-blue-700 text-sm">
          OIT Equipment
        </Link>
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                pathname === link.href
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {email && (
          <span className="text-xs text-gray-400 hidden sm:block">{email}</span>
        )}
        {email ? (
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded border hover:border-red-200 hover:bg-red-50 transition-colors"
          >
            ออกจากระบบ
          </button>
        ) : (
          <Link
            href="/login"
            className="text-xs text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
          >
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </nav>
  )
}
