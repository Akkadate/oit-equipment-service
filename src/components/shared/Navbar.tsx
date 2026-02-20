'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import { PushToggle } from './PushToggle'

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
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [authUser, setAuthUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthUser(data.user)
        setEditName(data.user.user_metadata?.full_name ?? '')
      }
    })
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function saveDisplayName() {
    if (!editName.trim()) return
    setSavingName(true)
    const supabase = createClient()
    const { data } = await supabase.auth.updateUser({ data: { full_name: editName.trim() } })
    if (data.user) setAuthUser(data.user)
    setSavingName(false)
    setShowProfile(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = authUser?.user_metadata?.full_name || authUser?.email || null

  return (
    <div className="relative z-30">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-4">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden flex flex-col justify-center gap-[5px] w-7 h-7 rounded hover:bg-gray-100 p-1 transition-colors"
            aria-label="เมนู"
          >
            <span className={`block h-0.5 bg-gray-600 rounded transition-all ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-gray-600 rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-gray-600 rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>

          <Link href="/" className="font-semibold text-blue-700 text-sm">
            OIT Equipment
          </Link>

          {/* Desktop nav links */}
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

        {/* Right: push toggle + profile + logout */}
        <div className="flex items-center gap-2">
          {authUser ? (
            <>
              <PushToggle />

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowProfile((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {(displayName ?? '?')[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:block max-w-[140px] truncate">{displayName}</span>
                  <span className="text-gray-400">▾</span>
                </button>

                {showProfile && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64 z-50">
                    <p className="text-[11px] text-gray-400 mb-1">{authUser.email}</p>
                    <p className="text-xs font-medium text-gray-700 mb-2">ชื่อที่แสดงในระบบ</p>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveDisplayName()}
                      placeholder="ชื่อ-นามสกุล เช่น สมชาย ใจดี"
                      className="w-full border rounded-lg px-3 py-1.5 text-sm mb-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveDisplayName}
                        disabled={savingName || !editName.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {savingName ? 'บันทึก...' : 'บันทึกชื่อ'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowProfile(false)}
                        className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded border hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                ออกจากระบบ
              </button>
            </>
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

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="px-3 py-2 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {authUser && (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">{displayName ?? authUser.email}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
