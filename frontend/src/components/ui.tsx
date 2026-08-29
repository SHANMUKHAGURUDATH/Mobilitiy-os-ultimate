import type { ReactNode } from 'react'
import type { RiskLevel } from '../types'

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`bg-surface border border-grid rounded-lg ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-4 pt-4 pb-2">
      <div>
        <h3 className="font-display text-sm font-semibold text-text">{title}</h3>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatBlock({ label, value, unit, tone = 'default' }: { label: string; value: string | number; unit?: string; tone?: 'default' | 'signal' | 'amber' | 'red' }) {
  const toneClass = {
    default: 'text-text',
    signal: 'text-signal',
    amber: 'text-amber',
    red: 'text-red',
  }[tone]
  return (
    <div className="bg-surface border border-grid rounded-lg px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-wide text-muted font-mono">{label}</div>
      <div className={`font-mono text-2xl font-semibold mt-1 ${toneClass}`}>
        {value}
        {unit && <span className="text-sm text-muted ml-1">{unit}</span>}
      </div>
    </div>
  )
}

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: 'bg-signal/10 text-signal border-signal/30',
  MEDIUM: 'bg-amber/10 text-amber border-amber/30',
  HIGH: 'bg-amber/20 text-amber border-amber/40',
  CRITICAL: 'bg-red/10 text-red border-red/30',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${RISK_STYLES[level]}`}>
      {level}
    </span>
  )
}

export function StatusPill({ tone, children }: { tone: 'signal' | 'amber' | 'red' | 'muted'; children: ReactNode }) {
  const cls = {
    signal: 'bg-signal/10 text-signal border-signal/30',
    amber: 'bg-amber/10 text-amber border-amber/30',
    red: 'bg-red/10 text-red border-red/30',
    muted: 'bg-grid/30 text-muted border-grid',
  }[tone]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${cls}`}>{children}</span>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-grid rounded-lg py-14 text-center">
      <div className="font-display text-sm text-text mb-1">{title}</div>
      <div className="text-xs text-muted max-w-sm mx-auto">{description}</div>
    </div>
  )
}

export function PrimaryButton({ children, onClick, className = '', disabled = false }: { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md bg-signal text-ink font-medium text-sm hover:bg-signal-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md border border-grid text-text font-medium text-sm hover:border-signal/50 hover:text-signal transition-colors ${className}`}
    >
      {children}
    </button>
  )
}
