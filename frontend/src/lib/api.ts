// Thin fetch wrapper for the real backend (backend/src/index.ts).
// No mock data lives here — every function hits a real HTTP endpoint and
// throws/returns the real response. Empty results render as real empty
// states in the UI ("No vehicles registered."), never fake rows.

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('mobility_os_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ---- Auth ----
export const AuthApi = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    request<{ token: string; user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
}

// ---- Vehicles ----
export interface VehicleDTO {
  id: string
  registrationNumber: string
  vehicleType: string
  category: string
  operator?: string
  routeName?: string
  status: string
  connectionStatus: 'LIVE' | 'STALE' | 'OFFLINE'
  position: { lat: number; lng: number } | null
  heading?: number
  speedKmh?: number
  lastUpdateAt?: string
  createdAt: string
  updatedAt: string
}

export const VehiclesApi = {
  list: (params?: Record<string, string>) =>
    request<VehicleDTO[]>(`/api/vehicles${params ? `?${new URLSearchParams(params)}` : ''}`),
  get: (id: string) => request<VehicleDTO>(`/api/vehicles/${id}`),
  create: (data: Partial<VehicleDTO>) => request<VehicleDTO>('/api/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<VehicleDTO>) => request<VehicleDTO>(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/api/vehicles/${id}`, { method: 'DELETE' }),
  postLocation: (id: string, loc: { latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number; source?: 'gps' | 'simulation' }) =>
    request(`/api/vehicles/${id}/location`, { method: 'POST', body: JSON.stringify(loc) }),
  locations: (id: string) => request<any[]>(`/api/vehicles/${id}/locations`),
  documents: (id: string) => request<any[]>(`/api/vehicles/${id}/documents`),
  incidents: (id: string) => request<any[]>(`/api/vehicles/${id}/incidents`),
}

// ---- Documents ----
export const DocumentsApi = {
  list: (params?: Record<string, string>) => request<any[]>(`/api/documents${params ? `?${new URLSearchParams(params)}` : ''}`),
  upload: (file: File, extra?: { vehicleId?: string; incidentId?: string; kind?: string }) => {
    const form = new FormData()
    form.append('file', file)
    if (extra?.vehicleId) form.append('vehicleId', extra.vehicleId)
    if (extra?.incidentId) form.append('incidentId', extra.incidentId)
    if (extra?.kind) form.append('kind', extra.kind)
    return request<any>('/api/documents/upload', { method: 'POST', body: form })
  },
  remove: (id: string) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
}

// ---- Incidents ----
export const IncidentsApi = {
  list: (params?: Record<string, string>) => request<any[]>(`/api/incidents${params ? `?${new URLSearchParams(params)}` : ''}`),
  get: (id: string) => request<any>(`/api/incidents/${id}`),
  create: (data: any) => request<any>('/api/incidents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadEvidence: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<any>(`/api/incidents/${id}/evidence`, { method: 'POST', body: form })
  },
  analyzeEvidence: (incidentId: string, evidenceId: string) =>
    request<any>(`/api/incidents/${incidentId}/evidence/${evidenceId}/analyze`, { method: 'POST' }),
}

// ---- Citizen reports ----
export const CitizenReportsApi = {
  list: (params?: Record<string, string>) => request<any[]>(`/api/citizen-reports${params ? `?${new URLSearchParams(params)}` : ''}`),
  create: (data: { description: string; photoUrl?: string; latitude: number; longitude: number }) =>
    request<any>('/api/citizen-reports', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => request<any>(`/api/citizen-reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
}

// ---- Notifications ----
export const NotificationsApi = {
  list: () => request<any[]>('/api/notifications'),
  markRead: (id: string) => request<any>(`/api/notifications/${id}/read`, { method: 'PUT' }),
}

// ---- System health ----
export interface SystemHealth {
  backend: { status: string }
  database: { status: string; detail?: string }
  googleMapsServerKey: { status: string }
  aiService: { status: string; detail?: string }
  storage: { status: string; provider: string }
  websocket: { status: string; path: string }
  simulationMode: boolean
  checkedAt: string
}
export const SystemApi = {
  health: () => request<SystemHealth>('/api/system/health'),
}
