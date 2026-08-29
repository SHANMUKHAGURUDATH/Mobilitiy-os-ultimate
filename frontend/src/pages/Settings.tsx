import { Card, CardHeader } from '../components/ui'
import { useAuth, ALL_ROLES } from '../context/AuthContext'

export default function Settings() {
  const { user, setRole } = useAuth()

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="font-display text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader title="Profile" sub="Mock authentication for this prototype" />
        <div className="px-4 pb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="text-muted">Name</div><div>{user.name}</div>
          <div className="text-muted">User ID</div><div className="font-mono text-xs">{user.id}</div>
          <div className="text-muted">Role</div><div className="font-mono text-xs">{user.role}</div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Demo role switcher" sub="Swap roles to preview access control across modules" />
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono border ${user.role === r ? 'border-signal/60 text-signal bg-surface-raised' : 'border-grid text-muted'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <CardHeader title="Appearance" />
        <p className="text-xs text-muted px-0 pb-2">Dark mode is the default and only theme in this prototype build. Light mode can be added by extending the token set in <code className="font-mono">index.css</code>.</p>
      </Card>
    </div>
  )
}
