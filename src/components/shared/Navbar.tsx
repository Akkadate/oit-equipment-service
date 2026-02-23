'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'
import { PushToggle } from './PushToggle'
import { LayoutDashboard, Wrench, BarChart3, Settings2, ChevronDown, Menu, X, LogOut, User } from 'lucide-react'

const mainLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/repairs', label: 'แจ้งซ่อม', icon: Wrench },
  { href: '/admin/reports', label: 'รายงาน', icon: BarChart3 },
]

const adminLinks = [
  { href: '/admin/equipment', label: 'อุปกรณ์' },
  { href: '/admin/equipment-types', label: 'ประเภทอุปกรณ์' },
  { href: '/admin/rooms', label: 'ห้องเรียน / QR' },
  { href: '/admin/buildings', label: 'อาคาร' },
  { href: '/admin/campuses', label: 'วิทยาเขต' },
]

const allLinks = [...mainLinks.map(l => ({ href: l.href, label: l.label })), ...adminLinks]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement>(null)
  const adminRef = useRef<HTMLDivElement>(null)

  const [authUser, setAuthUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setShowAdmin(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setMenuOpen(false); setShowAdmin(false) }, [pathname])

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
  const initials = (displayName ?? '?')[0].toUpperCase()
  const isAdminActive = adminLinks.some(l => pathname.startsWith(l.href))

  return (
    <div className="sticky top-0 z-30">
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm px-4 h-14 flex items-center justify-between gap-4">

        {/* Left */}
        <div className="flex items-center gap-1 min-w-0">
          {/* Hamburger — mobile */}
          <button type="button" onClick={() => setMenuOpen(v => !v)}
            className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0"
            aria-label="เมนู">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-1 mr-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-sm">
              <span className="text-white text-[11px] font-black tracking-tight">OIT</span>
            </div>
            <span className="hidden sm:block font-semibold text-gray-900 text-sm">AssetLink</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center">
            {mainLinks.map((link) => {
              const Icon = link.icon
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg mx-0.5 transition-colors ${
                    active ? 'text-blue-700 font-medium bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}>
                  <Icon size={14} className={active ? 'text-blue-600' : 'text-gray-400'} />
                  {link.label}
                </Link>
              )
            })}

            {/* Admin dropdown */}
            <div className="relative mx-0.5" ref={adminRef}>
              <button type="button" onClick={() => setShowAdmin(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isAdminActive ? 'text-blue-700 font-medium bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <Settings2 size={14} className={isAdminActive ? 'text-blue-600' : 'text-gray-400'} />
                จัดการ
                <ChevronDown size={13} className={`transition-transform ${showAdmin ? 'rotate-180' : ''}`} />
              </button>
              {showAdmin && (
                <div className="absolute left-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 w-44 z-50">
                  {adminLinks.map(link => (
                    <Link key={link.href} href={link.href}
                      className={`block px-3.5 py-2 text-sm transition-colors ${
                        pathname.startsWith(link.href)
                          ? 'text-blue-700 bg-blue-50 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {authUser ? (
            <>
              <PushToggle />

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button type="button" onClick={() => setShowProfile(v => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-xs text-gray-700 max-w-[120px] truncate font-medium">{displayName}</span>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform hidden sm:block ${showProfile ? 'rotate-180' : ''}`} />
                </button>

                {showProfile && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-72 z-50">
                    {/* User info header */}
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-[11px] text-gray-400 truncate">{authUser.email}</p>
                      </div>
                    </div>

                    {/* Edit display name */}
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <User size={11} /> ชื่อที่แสดงในระบบ
                    </p>
                    <input type="text" value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveDisplayName()}
                      placeholder="ชื่อ-นามสกุล เช่น สมชาย ใจดี"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm mb-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={saveDisplayName}
                        disabled={savingName || !editName.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded-lg disabled:opacity-50 transition-colors font-medium">
                        {savingName ? 'บันทึก...' : 'บันทึกชื่อ'}
                      </button>
                      <button type="button" onClick={() => setShowProfile(false)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
                        ยกเลิก
                      </button>
                    </div>

                    {/* Logout */}
                    <button type="button" onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-red-600 hover:bg-red-50 py-1.5 rounded-lg border border-red-100 transition-colors font-medium">
                      <LogOut size={12} />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login"
              className="text-xs text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors font-medium">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl">
          <div className="px-3 py-2">
            {allLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm transition-colors mb-0.5 ${
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>
          {authUser && (
            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <p className="text-xs text-gray-600 max-w-[160px] truncate">{displayName ?? authUser.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <PushToggle />
                <button type="button" onClick={handleLogout}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <LogOut size={13} /> ออก
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
