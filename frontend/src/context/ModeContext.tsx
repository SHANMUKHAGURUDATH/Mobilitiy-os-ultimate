import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type OperatingMode = 'LIVE' | 'SIMULATION'

interface ModeContextValue {
  mode: OperatingMode
  setMode: (m: OperatingMode) => void
}

const ModeContext = createContext<ModeContextValue>({ mode: 'LIVE', setMode: () => {} })

const STORAGE_KEY = 'mobility_os_mode'

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OperatingMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'SIMULATION' ? 'SIMULATION' : 'LIVE'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  return (
    <ModeContext.Provider value={{ mode, setMode: setModeState }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  return useContext(ModeContext)
}
