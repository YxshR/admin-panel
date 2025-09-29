'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Images,
  FolderOpen,
  Users,
  Activity,
  Settings,
  User,
  Menu,
  X,
  Shield
} from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Images', href: '/admin/images', icon: Images },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Activity', href: '/admin/activity', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Profile', href: '/admin/profile', icon: User },
]

export default function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isMobileMenuOpen && !target.closest('[data-sidebar]') && !target.closest('[data-sidebar-toggle]')) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        data-sidebar-toggle
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 rounded-md bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700 shadow-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        data-sidebar
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-5 border-b border-slate-700/50">
            <Link href="/admin" className="flex items-center space-x-3 touch-manipulation w-full" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white truncate">Admin Panel</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation relative
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 active:bg-slate-700/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0">
                    <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                  </div>
                  <span className="font-medium truncate">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75 flex-shrink-0"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-400 text-center font-medium">
              © 2024 Admin Panel
            </div>
          </div>
        </div>
      </div>
    </>
  )
}