import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, Receipt,
  BarChart3, Settings, Menu, X, Wheat, ChevronRight
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cash-ledger', icon: BookOpen, label: 'Cash Book' },
  { to: '/owner-accounts', icon: Users, label: 'Owner Accounts' },
  { to: '/expenditure', icon: Receipt, label: 'Expenditure' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { settings } = useApp()
  const location = useLocation()

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/cash-ledger': 'Cash Book',
    '/owner-accounts': 'Owner Accounts',
    '/expenditure': 'Expenditure',
    '/reports': 'Reports',
    '/settings': 'Settings',
  }
  const currentTitle = pageTitles[location.pathname] || 'KRM Ledger'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
            <Wheat size={20} className="text-slate-900" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {settings.companyName}
            </p>
            <p className="text-slate-400 text-xs">Ledger Manager</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-amber-400 text-slate-900'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Settings at bottom */}
        <div className="px-3 pb-4 border-t border-slate-700 pt-3">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-amber-400 text-slate-900'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4 flex-shrink-0 no-print">
          <button
            className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{currentTitle}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
