import { useMode } from '../context/ModeContext'

export function ModeToggle() {
  const { mode, setMode } = useMode()
  return (
    <div className="space-y-1.5">
      <div className="flex rounded-md border border-grid overflow-hidden text-[11px] font-mono">
        <button
          onClick={() => setMode('LIVE')}
          className={`flex-1 py-1.5 transition-colors ${mode === 'LIVE' ? 'bg-signal text-black' : 'text-muted hover:text-text'}`}
        >
          LIVE
        </button>
        <button
          onClick={() => setMode('SIMULATION')}
          className={`flex-1 py-1.5 transition-colors ${mode === 'SIMULATION' ? 'bg-amber-500 text-black' : 'text-muted hover:text-text'}`}
        >
          SIMULATION
        </button>
      </div>
      <p className="text-[9px] text-muted text-center">
        {mode === 'LIVE' ? 'Real backend data only' : 'Demo movement — labeled everywhere'}
      </p>
    </div>
  )
}
