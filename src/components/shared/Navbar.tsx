'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/admin/equipment', label: 'อุปกรณ์' },
  { href: '/admin/rooms', label: 'ห้องเรียน / QR' },
  { href: '/admin/repairs', label: 'แจ้งซ่อม' },
]

export function Navbar() {
  const pathname = usePathname()

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
      <span className="text-xs text-gray-400">สำนักเทคโนโลยีสารสนเทศ NBK</span>
    </nav>
  )
}
