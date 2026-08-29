import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AuthUser, Role } from '../types'

// Demo role-switcher for exploring the UI without a real login. This is
// SEPARATE from the backend's real JWT auth (backend/src/middleware/auth.ts,
// backend/src/routes/auth.ts) — switching roles here does not grant a real
// bearer token, so protected backend writes (vehicle CRUD, incident status
// changes) will still be rejected unless you register/login for a real
// account via the Login page and hold a real token.
const DEMO_USERS: Record<Role, AuthUser> = {
  CITIZEN: { id: 'u-public', name: 'Guest Citizen', role: 'CITIZEN' },
  DRIVER: { id: 'u-driver', name: 'Registered Driver', role: 'DRIVER' },
  TRANSPORT_OPERATOR: { id: 'u-transport', name: 'Transport Authority Ops', role: 'TRANSPORT_OPERATOR' },
  AUTHORITY: { id: 'u-authority', name: 'District Authority', role: 'AUTHORITY' },
  ANALYST: { id: 'u-analyst', name: 'Data Analyst', role: 'ANALYST' },
  SUPER_ADMIN: { id: 'u-admin', name: 'Platform Super Admin', role: 'SUPER_ADMIN' },
}

interface AuthContextValue {
  user: AuthUser
  setRole: (role: Role) => void
  can: (roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(DEMO_USERS.CITIZEN)

  const setRole = (role: Role) => setUser(DEMO_USERS[role])
  const can = (roles: Role[]) => roles.includes(user.role) || user.role === 'SUPER_ADMIN'

  return <AuthContext.Provider value={{ user, setRole, can }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const ALL_ROLES: Role[] = ['CITIZEN', 'DRIVER', 'TRANSPORT_OPERATOR', 'AUTHORITY', 'ANALYST', 'SUPER_ADMIN']
