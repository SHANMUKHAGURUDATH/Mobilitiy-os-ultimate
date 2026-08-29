import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, Navigation2, Truck, Bus, Car, FileText, ShieldAlert,
  Siren, ParkingSquare, Fuel, Biohazard, Construction, Landmark, Bot, Boxes,
  BarChart3, Bell, Lock, Settings, ChevronDown, Radar,
} from 'lucide-react'
import { useAuth, ALL_ROLES } from '../context/AuthContext'
import { ModeToggle } from '../components/ModeToggle'
import type { Role } from '../types'
import { useState } from 'react'

const NAV: { to: string; label: string; icon: any; roles?: Role[] }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/live-map', label: 'Live Map', icon: MapPin },
  { to: '/dashboard/navigation', label: 'Navigation', icon: Navigation2 },
  { to: '/dashboard/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/dashboard/public-transport', label: 'Public Transport', icon: Bus },
  { to: '/dashboard/my-vehicles', label: 'My Vehicles', icon: Car },
  { to: '/dashboard/documents', label: 'Documents', icon: FileText },
  { to: '/dashboard/safety', label: 'Safety Intelligence', icon: ShieldAlert },
  { to: '/dashboard/emergency', label: 'Emergency', icon: Siren },
  { to: '/dashboard/parking', label: 'Parking', icon: ParkingSquare },
  { to: '/dashboard/fuel-ev', label: 'Fuel & EV', icon: Fuel },
  { to: '/dashboard/hazardous', label: 'Hazardous Vehicles', icon: Biohazard, roles: ['AUTHORITY', 'TRANSPORT_OPERATOR', 'SUPER_ADMIN'] },
  { to: '/dashboard/road-reports', label: 'Road Reports', icon: Construction },
  { to: '/dashboard/verification', label: 'Government Verification', icon: Landmark, roles: ['AUTHORITY', 'SUPER_ADMIN'] },
  { to: '/dashboard/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/dashboard/digital-twin', label: 'Urban Digital Twin', icon: Boxes, roles: ['AUTHORITY', 'TRANSPORT_OPERATOR', 'SUPER_ADMIN'] },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/system', label: 'System Health', icon: Radar },
  { to: '/dashboard/privacy', label: 'Privacy & Security', icon: Lock },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout() {
  const { user, setRole } = useAuth()
  const [roleOpen, setRoleOpen] = useState(false)
  const navigate = useNavigate()

  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <div className="flex h-screen bg-ink text-text font-sans overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-grid bg-surface flex flex-col">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-5 py-4 border-b border-grid text-left">
          <Radar className="text-signal shrink-0" size={22} />
          <div>
            <div className="font-display font-semibold text-sm leading-tight">MOBILITY OS</div>
            <div className="text-[10px] text-muted font-mono tracking-wide">URBAN INTELLIGENCE</div>
          </div>
        </button>
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                  isActive
                    ? 'border-signal bg-surface-raised text-text'
                    : 'border-transparent text-muted hover:text-text hover:bg-surface-raised/60'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-grid">
          <ModeToggle />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-grid bg-surface flex items-center justify-between px-6">
          <div className="text-xs text-muted font-mono">
            DETECT → UNDERSTAND → PREDICT → WARN → OPTIMIZE → RESOLVE
          </div>
          <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setRoleOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-raised border border-grid text-xs hover:border-signal/50 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-signal" />
              {user.name}
              <span className="text-muted font-mono">· {user.role}</span>
              <ChevronDown size={14} />
            </button>
            {roleOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-raised border border-grid rounded-md shadow-xl z-50 py-1">
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setRoleOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-ink transition-colors ${user.role === r ? 'text-signal' : 'text-text'}`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
